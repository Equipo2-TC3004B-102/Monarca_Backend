/**
 * FileName: vouchers.service
 * Description: Business logic layer for Voucher operations. Handles creation,
 *              retrieval, update, deletion, approval, and denial of vouchers.
 *              Enforces ownership rules, validates referenced request existence,
 *              and performs currency conversion via DB cache or Banxico API.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 22/04/2026 [Sebastián Borjas] Added multi-currency support: DB-cached exchange
 *                               rates with Banxico API fallback, unconverted_amount
 *                               stored alongside MXN-converted amount.
 * 05/05/2026 [Juan Pablo Narchi] Cross-check refund amount vs parsed CFDI total and
 *                                persist SAT validation status on create (issue #69-child).
 */

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, UpdateResult } from 'typeorm';
import { CreateVoucherDto } from './dto/create-voucher-dto';
import { UpdateVoucherDto } from './dto/update-voucher-dto';
import { CfdiStatus, Voucher } from './entities/vouchers.entity';
import { Request } from 'src/requests/entities/request.entity';
import { ParsedCfdi } from './interfaces/parsed-cfdi.interface';
import { CfdiValidationService } from './services/cfdi-validation.service';

/**
 * Shape returned by XmlParserService.parse(): the parser already normalizes the
 * extracted CFDI into voucher-compatible fields and adds the cfdi_version tag.
 */
export type ParsedCfdiVoucher = Partial<CreateVoucherDto> & Pick<ParsedCfdi, 'cfdi_version'>;

/** Tolerance (MXN) used when comparing the requested refund amount with the CFDI total. */
const CFDI_AMOUNT_TOLERANCE = 0.01;

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
    @InjectRepository(Request)
    private readonly rRepo: Repository<Request>,
    private readonly dataSource: DataSource,
    private readonly cfdiValidationService: CfdiValidationService,
  ) {}

  private clientError(message: string, code: string) {
    return new BadRequestException({ message, code });
  }

  /**
   * crossCheckCfdi - Validates the SAT status of the parsed CFDI and ensures
   *                  the refund amount in the DTO matches the invoice total.
   *                  Throws clear validation errors when the CFDI lacks the
   *                  fields required to validate it, when SAT reports the CFDI
   *                  as canceled or not found, or when the totals do not match
   *                  within tolerance.
   * Input: parsed (ParsedCfdiVoucher) - normalized data extracted from the uploaded XML;
   *        requestedAmount (number) - amount in the DTO (in invoice currency);
   *        currency (string) - currency reported in the DTO.
   * Output: Promise<CfdiStatus> - the resolved SAT status (always VALID when it
   *         succeeds; otherwise an exception is thrown).
   */
  private async crossCheckCfdi(
    parsed: ParsedCfdiVoucher,
    requestedAmount: number,
    currency: string,
  ): Promise<CfdiStatus> {
    if (!parsed.fiscal_uuid || !parsed.issuer_rfc || !parsed.receiver_rfc || parsed.amount === undefined) {
      throw this.clientError(
        'Parsed CFDI is missing required fiscal fields (fiscal_uuid, issuer_rfc, receiver_rfc or amount)',
        'VOUCHERS_CFDI_INVALID',
      );
    }

    if (currency && parsed.currency && currency.toUpperCase() !== parsed.currency.toUpperCase()) {
      throw this.clientError(
        `Voucher currency ${currency} does not match CFDI currency ${parsed.currency}`,
        'VOUCHERS_CFDI_CURRENCY_MISMATCH',
      );
    }

    const status = await this.cfdiValidationService.resolveStatus({
      fiscal_uuid: parsed.fiscal_uuid,
      issuer_rfc: parsed.issuer_rfc,
      receiver_rfc: parsed.receiver_rfc,
      amount: parsed.amount,
    });

    if (status === 'CANCELED') {
      throw this.clientError(
        `CFDI ${parsed.fiscal_uuid} is canceled at SAT and cannot be used as refund evidence`,
        'VOUCHERS_CFDI_CANCELED',
      );
    }
    if (status === 'NOT_FOUND') {
      throw this.clientError(
        `CFDI ${parsed.fiscal_uuid} could not be found at SAT`,
        'VOUCHERS_CFDI_NOT_FOUND',
      );
    }
    if (status === 'PENDING') {
      throw this.clientError(
        `CFDI ${parsed.fiscal_uuid} is still pending at SAT, retry later`,
        'VOUCHERS_CFDI_PENDING',
      );
    }

    if (Math.abs(requestedAmount - parsed.amount) > CFDI_AMOUNT_TOLERANCE) {
      throw this.clientError(
        `Refund amount (${requestedAmount}) does not match CFDI total (${parsed.amount})`,
        'VOUCHERS_AMOUNT_MISMATCH',
      );
    }

    return status;
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

  /**
   * create - Creates and persists a new voucher. Validates that the referenced
   *          request exists and that the caller is the owner of that request.
   *          For non-MXN currencies, resolves the exchange rate and converts the
   *          amount to MXN, storing the original amount in unconverted_amount.
   *          When a parsed CFDI is provided, runs the cross-check against the
   *          requested refund amount, validates the SAT status, and persists
   *          the extracted fiscal fields on the voucher (issue #69-child).
   * Input: id_user (string) - UUID of the authenticated user creating the voucher;
   *        data (CreateVoucherDto) - voucher fields;
   *        parsedCfdi (ParsedCfdi | undefined) - data extracted from the uploaded XML.
   * Output: Promise<Voucher> - the newly saved voucher entity.
   * Throws BadRequestException if the referenced request does not exist,
   *        if the caller is not the request owner, if the CFDI is canceled or
   *        not found, or if the requested amount does not match the CFDI total.
   */
  async create(
    id_user: string,
    data: CreateVoucherDto,
    parsedCfdi?: ParsedCfdiVoucher,
  ): Promise<Voucher> {
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

    let cfdiStatus: CfdiStatus | null = null;
    if (parsedCfdi) {
      cfdiStatus = await this.crossCheckCfdi(parsedCfdi, data.amount, data.currency);
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
      exchange_rate: parsedCfdi?.exchange_rate ?? exchangeRate,
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
      cfdi_status: cfdiStatus,
    });
    return await this.voucherRepo.save(voucher);
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
   * approve - Sets a voucher's status to 'Voucher Approved'.
   * Input: id (string) - UUID of the voucher to approve.
   * Output: Promise<{ status: boolean; message: string }> - success flag and confirmation message.
   * Throws BadRequestException if no voucher with the given ID exists.
   */
  async approve(id: string): Promise<{ status: boolean; message: string }> {
    const result: UpdateResult = await this.voucherRepo.update(id, {
      status: 'Voucher Approved',
    });

    if (result.affected === 0) {
      throw new BadRequestException(`Voucher with ID ${id} not found`);
    }

    return { status: true, message: `Voucher ${id} approved` };
  }

  /**
   * deny - Sets a voucher's status to 'Voucher Denied'.
   * Input: id (string) - UUID of the voucher to deny.
   * Output: Promise<{ status: boolean; message: string }> - success flag and confirmation message.
   * Throws BadRequestException if no voucher with the given ID exists.
   */
  async deny(id: string): Promise<{ status: boolean; message: string }> {
    const result: UpdateResult = await this.voucherRepo.update(id, {
      status: 'Voucher Denied',
    });

    if (result.affected === 0) {
      throw new BadRequestException(`Voucher with ID ${id} not found`);
    }

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
