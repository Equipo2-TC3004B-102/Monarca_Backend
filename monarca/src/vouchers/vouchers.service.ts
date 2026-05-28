/**
 * FileName: vouchers.service
 * Description: Business logic layer for Voucher operations. Handles creation,
 *              retrieval, update, deletion, approval, and denial of vouchers.
 *              Enforces ownership rules, validates referenced request existence,
 *              and performs currency conversion via DB cache or Banxico API.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 27/05/2026 [Julio Rodriguez] Added request_logs entries for upload, approve, and deny voucher actions.
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateVoucherDto } from './dto/create-voucher-dto';
import { UpdateVoucherDto } from './dto/update-voucher-dto';
import { Voucher } from './entities/vouchers.entity';
import { VoucherCreationLog } from './entities/voucher-creation-log.entity';
import { Request } from 'src/requests/entities/request.entity';
import { Company } from 'src/companies/entity/company.entity';
import { CfdiValidationService } from './services/cfdi-validation.service';
import { CfdiStatus } from './types/cfdi-status.type';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { RequestLog } from 'src/request-logs/entities/request-log.entity';

type ParsedVoucherCfdi = Partial<CreateVoucherDto>;

const BANXICO_CURRENCY_MAPPING: Record<string, string> = {
  USD: 'SF43718',
  EUR: 'SF46410',
  JPY: 'SF46406',
  GBP: 'SF46407',
  CAD: 'SF60632',
  CHF: 'SF46405',
  CNY: 'SF290383',
  BRL: 'SF290312',
  ARS: 'SF290311',
  CLP: 'SF290351',
  COP: 'SF290382',
  SDR: 'SF46411',
};

@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(VoucherCreationLog)
    private readonly logRepo: Repository<VoucherCreationLog>,
    @InjectRepository(Request)
    private readonly rRepo: Repository<Request>,
    @InjectRepository(RequestsDestination)
    private readonly rdRepo: Repository<RequestsDestination>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(RequestLog)
    private readonly requestLogRepo: Repository<RequestLog>,
    private readonly dataSource: DataSource,
    private readonly cfdiValidationService: CfdiValidationService,
  ) {}

  private getFailureReason(error: unknown): string {
    if (error instanceof BadRequestException) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (typeof response === 'object' && response !== null) {
        const msg = (response as { message?: string | string[] }).message;
        if (Array.isArray(msg)) return msg.join(', ');
        if (typeof msg === 'string') return msg;
      }
    }
    if (error instanceof Error) return error.message;
    return String(error);
  }

  private raiseCfdiError(code: string, message: string): never {
    throw new BadRequestException({ message, code });
  }

  /**
   * fetchBanxicoRate - Fetches the latest exchange rate for a given currency from the Banxico API.
   * Input: currency (string) - ISO 4217 currency code.
   * Output: Promise<number | null> - exchange rate in MXN, or null if unavailable.
   */
  private async fetchBanxicoRate(currency: string): Promise<number | null> {
    const banxicoId = BANXICO_CURRENCY_MAPPING[currency];
    if (!banxicoId) return null;

    const bmxToken = process.env['BMX-TOKEN'];
    if (!bmxToken) {
      console.warn('BMX-TOKEN is not set in environment.');
      return null;
    }

    try {
      const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${banxicoId}/datos/oportuno`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Bmx-Token': bmxToken,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`Banxico API error: ${response.statusText}`);
        return null;
      }

      const rawData = await response.json();
      const series = rawData?.bmx?.series?.[0];
      const data = series?.datos?.[0];

      if (data && data.dato) {
        const rate = parseFloat(data.dato);
        return isNaN(rate) ? null : rate;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch from Banxico API:', error);
      return null;
    }
  }

  /**
   * resolveExchangeRate - Returns today's exchange rate for a currency, using the DB
   *                       cache first and falling back to the Banxico API.
   *                       Persists newly fetched rates to the DB for future requests.
   * Input: currency (string) - ISO 4217 currency code.
   * Output: Promise<number | null> - exchange rate in MXN, or null if unavailable.
   */
  private async resolveExchangeRate(currency: string): Promise<number | null> {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const rows = await this.dataSource.query(
      `SELECT exchange_rate FROM exchange_rates WHERE currency = $1 AND update_date = $2`,
      [currency, todayStr],
    );

    if (rows && rows.length > 0) {
      return Number(rows[0].exchange_rate);
    }

    console.log(`No exchange rate in DB for ${currency} on ${todayStr}. Fetching from Banxico...`);
    const fetchedRate = await this.fetchBanxicoRate(currency);

    if (fetchedRate !== null) {
      await this.dataSource.query(
        `INSERT INTO exchange_rates (currency, exchange_rate, update_date) VALUES ($1, $2, $3)`,
        [currency, fetchedRate, todayStr],
      );
    }

    return fetchedRate;
  }

  private async crossCheckCfdi(
    data: CreateVoucherDto,
    parsedCfdi?: ParsedVoucherCfdi,
  ): Promise<CfdiStatus | null> {
    const fiscalUuid = parsedCfdi?.fiscal_uuid ?? data.fiscal_uuid;
    if (!parsedCfdi && !fiscalUuid) {
      return null;
    }

    if (!fiscalUuid) {
      this.raiseCfdiError(
        'VOUCHERS_CFDI_INVALID',
        'The CFDI XML does not include a valid fiscal UUID.',
      );
    }

    const status = await this.cfdiValidationService.validateSatStatus(fiscalUuid);

    if (status === 'CANCELED') {
      this.raiseCfdiError(
        'VOUCHERS_CFDI_CANCELED',
        'The CFDI invoice has been canceled by SAT.',
      );
    }

    if (status === 'NOT_FOUND') {
      this.raiseCfdiError(
        'VOUCHERS_CFDI_NOT_FOUND',
        'The CFDI invoice was not found in SAT.',
      );
    }

    if (status === 'PENDING') {
      this.raiseCfdiError(
        'VOUCHERS_CFDI_PENDING',
        'The CFDI invoice validation is pending in SAT.',
      );
    }

    const parsedCurrency = (parsedCfdi?.currency ?? data.currency ?? '').toUpperCase();
    const dtoCurrency = (data.currency ?? '').toUpperCase();
    if (parsedCurrency && dtoCurrency && parsedCurrency !== dtoCurrency) {
      this.raiseCfdiError(
        'VOUCHERS_CFDI_CURRENCY_MISMATCH',
        'The CFDI currency does not match the requested refund currency.',
      );
    }

    if (
      parsedCfdi?.amount !== undefined &&
      Math.abs(parsedCfdi.amount - data.amount) > 0.01
    ) {
      this.raiseCfdiError(
        'VOUCHERS_AMOUNT_MISMATCH',
        'The requested refund amount does not match the CFDI amount.',
      );
    }

    return status;
  }

  /**
   * create - Creates and persists a new voucher. Validates that the referenced
   *          request exists and that the caller is the owner of that request.
   *          For non-MXN currencies, resolves the exchange rate and converts the
   *          amount to MXN, storing the original amount in unconverted_amount.
   * Input: id_user (string) - UUID of the authenticated user creating the voucher;
   *        data (CreateVoucherDto) - voucher fields.
   * Output: Promise<Voucher> - the newly saved voucher entity.
   * Throws BadRequestException if the referenced request does not exist.
   * Throws BadRequestException if the caller is not the request owner.
   */
  async create(
    id_user: string,
    data: CreateVoucherDto,
    parsedCfdi?: ParsedVoucherCfdi,
  ): Promise<Voucher> {
    try {
      const request = await this.rRepo.findOne({
        where: { id: data.id_request },
      });
      if (!request) {
        throw new BadRequestException(
          `RequestDestination ${data.id_request} not found`,
        );
      }
      const approverId = request.id_admin;
      const id_creator = request.id_user;
      if (id_user !== id_creator) {
        throw new BadRequestException(
          `User ${id_user} is not authorized to create a voucher for this request`,
        );
      }

      const cfdiStatus = await this.crossCheckCfdi(data, parsedCfdi);

      const [firstDestination, lastDestination, company] = await Promise.all([
        this.rdRepo.findOne({
          where: { id_request: data.id_request },
          order: { destination_order: 'ASC' },
        }),
        this.rdRepo.findOne({
          where: { id_request: data.id_request, is_last_destination: true },
        }),
        this.companyRepo.findOne({ where: { id: request.id_company } }),
      ]);
      if (firstDestination && lastDestination) {
        const deadlineDays = company?.voucher_deadline_days ?? 7;
        const today = new Date();
        const voucherDate = new Date(data.date);
        const tripStart = new Date(firstDestination.departure_date).getTime();
        const tripEnd = new Date(lastDestination.arrival_date).getTime();
        const deadlineMs = tripEnd + deadlineDays * 24 * 60 * 60 * 1000;

        if (voucherDate.getTime() < tripStart) {
          throw new BadRequestException(
            `Voucher date cannot be before the trip start date`,
          );
        }
        if (voucherDate.getTime() > tripEnd) {
          throw new BadRequestException(
            `Voucher date cannot be after the trip end date`,
          );
        }
        if (today.getTime() < tripStart) {
          throw new BadRequestException(
            `Vouchers cannot be submitted before the trip has started`,
          );
        }
        if (today.getTime() > deadlineMs) {
          throw new BadRequestException(
            `Vouchers can only be submitted within ${deadlineDays} days after the trip ends`,
          );
        }
      }

      let finalAmount: number = data.amount;
      let unconvertedAmount: number | null = null;
      let exchangeRate: number | null = null;

      if (data.currency && data.currency !== 'MXN') {
        const rate = await this.resolveExchangeRate(data.currency);
        if (rate !== null) {
          exchangeRate = rate;
          unconvertedAmount = data.amount;
          finalAmount = Math.round(data.amount * rate * 100) / 100;
        }
      }

      const voucher = this.voucherRepo.create({
        id_request: data.id_request,
        class: data.class,
        amount: finalAmount,
        unconverted_amount: unconvertedAmount,
        currency: data.currency,
        tax_type: data.tax_type,
        date: new Date(data.date),
        file_url_pdf: data.file_url_pdf,
        file_url_xml: data.file_url_xml,
        status: data.status,
        id_approver: approverId,
        exchange_rate: exchangeRate,
        cfdi_status: cfdiStatus,
        fiscal_uuid: parsedCfdi?.fiscal_uuid ?? data.fiscal_uuid ?? null,
        issuer_rfc: parsedCfdi?.issuer_rfc ?? data.issuer_rfc ?? null,
        issuer_name: parsedCfdi?.issuer_name ?? data.issuer_name ?? null,
        receiver_rfc: parsedCfdi?.receiver_rfc ?? data.receiver_rfc ?? null,
        receiver_name: parsedCfdi?.receiver_name ?? data.receiver_name ?? null,
        subtotal: parsedCfdi?.subtotal ?? data.subtotal ?? null,
        discount: parsedCfdi?.discount ?? data.discount ?? null,
        iva_trasladado: parsedCfdi?.iva_trasladado ?? data.iva_trasladado ?? null,
        ieps_trasladado: parsedCfdi?.ieps_trasladado ?? data.ieps_trasladado ?? null,
        isr_retenido: parsedCfdi?.isr_retenido ?? data.isr_retenido ?? null,
        iva_retenido: parsedCfdi?.iva_retenido ?? data.iva_retenido ?? null,
        payment_form: parsedCfdi?.payment_form ?? data.payment_form ?? null,
        payment_method: parsedCfdi?.payment_method ?? data.payment_method ?? null,
      });

      let saved: Voucher;
      try {
        saved = await this.voucherRepo.save(voucher);
      } catch (saveError) {
        const e = saveError as {
          code?: string;
          driverError?: { code?: string };
          original?: { code?: string };
        };
        const pgCode = e?.code ?? e?.driverError?.code ?? e?.original?.code;
        if (pgCode === '23505') {
          throw new BadRequestException(
            'This voucher is already registered in the system',
          );
        }
        throw saveError;
      }

      await this.logRepo.save(
        this.logRepo.create({
          id_request: data.id_request,
          id_user,
          outcome: 'success',
          failure_reason: null,
          attempted_voucher_date: data.date,
        }),
      );

      const amountFormatted = finalAmount.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
      });
      await this.requestLogRepo.save(
        this.requestLogRepo.create({
          id_request: data.id_request,
          id_user,
          report: `Comprobante subido. Monto: ${amountFormatted}.`,
          new_status: request.status,
        }),
      );

      return saved;
    } catch (error) {
      await this.logRepo.save(
        this.logRepo.create({
          id_request: data.id_request ?? null,
          id_user,
          outcome: 'failure',
          failure_reason: this.getFailureReason(error),
          attempted_voucher_date: data.date ?? null,
        }),
      );
      throw error;
    }
  }

  /**
   * findAll - Retrieves all vouchers from the database without filters.
   * Input: None
   * Output: Promise<Voucher[]> - array of all persisted voucher entities.
   */
  async findAll(): Promise<Voucher[]> {
    return this.voucherRepo.find();
  }

  /**
   * findOne - Retrieves a single voucher by its UUID.
   * Input: id (string) - UUID of the voucher to retrieve.
   * Output: Promise<Voucher> - the matching voucher entity.
   * Throws BadRequestException if no voucher with the given ID exists.
   */
  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepo.findOne({ where: { id } });
    if (!voucher) {
      throw new BadRequestException(`Voucher with ID ${id} not found`);
    }
    return voucher;
  }

  /**
   * update - Partially updates a voucher's fields. Only fields present in the
   *          DTO overwrite existing values; omitted fields keep their current values.
   * Input: id (string) - UUID of the voucher to update;
   *        data (UpdateVoucherDto) - optional fields to apply.
   * Output: Promise<Voucher> - the voucher entity after applying the updates.
   */
  async update(id: string, data: UpdateVoucherDto): Promise<Voucher> {
    const existingVoucher = await this.findOne(id);

    const updatedVoucherData = {
      id_request: data.id_request ?? existingVoucher.id_request,
      class: data.class ?? existingVoucher.class,
      amount: data.amount ?? existingVoucher.amount,
      tax_type: data.tax_type ?? existingVoucher.tax_type,
      currency: data.currency ?? existingVoucher.currency,
      date: data.date ? new Date(data.date) : existingVoucher.date,
      file_url_pdf: data.file_url_pdf ?? existingVoucher.file_url_pdf,
      file_url_xml: data.file_url_xml ?? existingVoucher.file_url_xml,
      status: data.status ?? existingVoucher.status,
    };

    await this.voucherRepo.update(id, updatedVoucherData);
    return this.findOne(id);
  }

  /**
   * remove - Deletes a voucher record from the database by its UUID.
   * Input: id (string) - UUID of the voucher to delete.
   * Output: Promise<{ status: boolean; message: string }> - success flag and confirmation message.
   * Throws BadRequestException if no voucher with the given ID exists.
   */
  async remove(id: string): Promise<{ status: boolean; message: string }> {
    const result = await this.voucherRepo.delete(id);
    if (!result.affected) {
      throw new BadRequestException(`Voucher with ID ${id} not found`);
    }
    return { status: true, message: `Voucher with ID ${id} removed` };
  }

  /**
   * approve - Sets a voucher's status to 'Voucher Approved' and records the action in request_logs.
   * Input: id (string) - UUID of the voucher to approve;
   *        id_user (string) - UUID of the user performing the approval.
   * Output: Promise<{ status: boolean; message: string }> - success flag and confirmation message.
   * Throws BadRequestException if no voucher with the given ID exists.
   */
  async approve(id: string, id_user: string): Promise<{ status: boolean; message: string }> {
    const voucher = await this.voucherRepo.findOne({ where: { id } });
    if (!voucher) {
      throw new BadRequestException(`Voucher with ID ${id} not found`);
    }
    await this.voucherRepo.update(id, { status: 'Voucher Approved' });
    await this.requestLogRepo.save(
      this.requestLogRepo.create({
        id_request: voucher.id_request,
        id_user,
        report: `Comprobante aprobado.`,
        new_status: 'Voucher Approved',
      }),
    );
    return { status: true, message: `Voucher ${id} approved` };
  }

  /**
   * deny - Sets a voucher's status to 'Voucher Denied' and records the action in request_logs.
   * Input: id (string) - UUID of the voucher to deny;
   *        id_user (string) - UUID of the user performing the denial.
   * Output: Promise<{ status: boolean; message: string }> - success flag and confirmation message.
   * Throws BadRequestException if no voucher with the given ID exists.
   */
  async deny(id: string, id_user: string): Promise<{ status: boolean; message: string }> {
    const voucher = await this.voucherRepo.findOne({ where: { id } });
    if (!voucher) {
      throw new BadRequestException(`Voucher with ID ${id} not found`);
    }
    await this.voucherRepo.update(id, { status: 'Voucher Denied' });
    await this.requestLogRepo.save(
      this.requestLogRepo.create({
        id_request: voucher.id_request,
        id_user,
        report: `Comprobante rechazado.`,
        new_status: 'Voucher Denied',
      }),
    );
    return { status: true, message: `Voucher ${id} denied` };
  }

  /**
   * findByRequest - Retrieves all vouchers linked to a specific travel request.
   * Input: requestId (string) - UUID of the travel request to filter vouchers by.
   * Output: Promise<Voucher[]> - array of vouchers associated with the given request.
   * Throws BadRequestException if no vouchers exist for the given request ID.
   */
  async findByRequest(requestId: string): Promise<Voucher[]> {
    const vouchers = await this.voucherRepo.find({
      where: { id_request: requestId },
    });
    if (vouchers.length === 0) {
      throw new BadRequestException(
        `No vouchers found for Request ID ${requestId}`,
      );
    }
    return vouchers;
  }
}
