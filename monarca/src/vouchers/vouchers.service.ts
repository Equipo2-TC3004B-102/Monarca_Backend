/**
 * FileName: vouchers.service
 * Description: Business logic layer for Voucher operations. Handles creation,
 *              retrieval, update, deletion, approval, and denial of vouchers.
 *              Enforces ownership rules and validates referenced request existence.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 11/04/2026 [Julio Rodriguez] Standardized client error handling to
 *                              BadRequestException for HTTP 400 policy and
 *                              aligned header documentation.
 */

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { CreateVoucherDto } from './dto/create-voucher-dto';
import { UpdateVoucherDto } from './dto/update-voucher-dto';
import { Voucher } from './entities/vouchers.entity';
import { Request } from 'src/requests/entities/request.entity';
import { XmlParserService } from './services/xml-parser.service';

type VoucherUploadFiles = {
  file_url_pdf?: string;
  file_url_xml?: string;
};

type ParsedUploadData = Partial<CreateVoucherDto> & {
  cfdi_version?: string;
};
@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(Request)
    private readonly rRepo: Repository<Request>,
    private readonly xmlParserService: XmlParserService,
  ) {}

  /**
   * create - Creates and persists a new voucher. Validates that the referenced
   *          request exists and that the caller is the owner of that request.
   * Input: id_user (string) - UUID of the authenticated user creating the voucher;
   *        data (CreateVoucherDto) - voucher fields: id_request, class, amount,
   *        currency, tax_type, date, file_url_pdf, file_url_xml, status.
   * Output: Promise<Voucher> - the newly saved voucher entity.
  * Throws BadRequestException if the referenced request does not exist.
  * Throws BadRequestException if the caller is not the request owner.
   */
  async create(
    id_user: string,
    data: CreateVoucherDto,
    xmlBuffer?: Buffer,
    fileUrls: VoucherUploadFiles = {},
  ): Promise<Voucher> {
    if (xmlBuffer) {
      return this.createFromUpload(id_user, data, xmlBuffer, fileUrls);
    }

    const request = await this.rRepo.findOne({
      where: { id: data.id_request },
    });
    if (!request) {
      throw new BadRequestException(
        `RequestDestination ${data.id_request} not found`,
      );
    }
    const approverId = request.id_admin;
    const id_creator= request.id_user;
    if (id_user !== id_creator) {
      throw new BadRequestException(
        `User ${id_user} is not authorized to create a voucher for this request`,
      );
    }
    const voucher = this.voucherRepo.create({
      id_request: data.id_request, // Using the correct DTO property
      class: data.class,
      amount: data.amount,
      currency: data.currency,
      tax_type: data.tax_type,
      date: new Date(data.date), // Ensuring that the date is correctly parsed
      file_url_pdf: data.file_url_pdf,
      file_url_xml: data.file_url_xml,
      status: data.status,
      id_approver: approverId, // Mapping the correct file URL
    });
    return await this.voucherRepo.save(voucher);
  }

  /**
   * createFromUpload - Creates and persists a voucher using XML fiscal data as
   *                    the source of truth for amount and date.
   * Input: id_user (string) - authenticated user creating the voucher;
   *        data (CreateVoucherDto) - business metadata supplied by the client;
   *        xmlBuffer (Buffer) - raw XML bytes to parse;
   *        fileUrls - publicly accessible file URLs already stored in object storage.
   * Output: Promise<Voucher> - the newly saved voucher entity.
   */
  async createFromUpload(
    id_user: string,
    data: CreateVoucherDto,
    xmlBuffer: Buffer,
    fileUrls: VoucherUploadFiles = {},
  ): Promise<Voucher> {
    const fiscalData = this.xmlParserService.parse(xmlBuffer);
    const { cfdi_version: _cfdiVersion, ...parsedFiscalData } = fiscalData as ParsedUploadData;

    const request = await this.rRepo.findOne({
      where: { id: data.id_request },
    });

    if (!request) {
      throw new BadRequestException(
        `RequestDestination ${data.id_request} not found`,
      );
    }

    const approverId = request.id_admin;
    const idCreator = request.id_user;

    if (id_user !== idCreator) {
      throw new BadRequestException(
        `User ${id_user} is not authorized to create a voucher for this request`,
      );
    }

    const voucherData = {
      ...data,
      ...fileUrls,
      ...parsedFiscalData,
      id_request: data.id_request,
      class: data.class,
      tax_type: data.tax_type,
      currency: parsedFiscalData.currency ?? data.currency,
      amount: parsedFiscalData.amount ?? data.amount,
      date: parsedFiscalData.date ?? data.date,
      id_approver: approverId,
    };

    try {
      const voucher = this.voucherRepo.create({
        id_request: voucherData.id_request,
        class: voucherData.class,
        amount: voucherData.amount,
        currency: voucherData.currency,
        tax_type: voucherData.tax_type,
        date: new Date(voucherData.date),
        file_url_pdf: voucherData.file_url_pdf ?? null,
        file_url_xml: voucherData.file_url_xml ?? null,
        status: voucherData.status,
        id_approver: voucherData.id_approver,
        fiscal_uuid: voucherData.fiscal_uuid ?? null,
        issuer_rfc: voucherData.issuer_rfc ?? null,
        issuer_name: voucherData.issuer_name ?? null,
        receiver_rfc: voucherData.receiver_rfc ?? null,
        receiver_name: voucherData.receiver_name ?? null,
        exchange_rate: voucherData.exchange_rate ?? null,
        subtotal: voucherData.subtotal ?? null,
        discount: voucherData.discount ?? null,
        iva_trasladado: voucherData.iva_trasladado ?? null,
        ieps_trasladado: voucherData.ieps_trasladado ?? null,
        isr_retenido: voucherData.isr_retenido ?? null,
        iva_retenido: voucherData.iva_retenido ?? null,
        payment_form: voucherData.payment_form ?? null,
        payment_method: voucherData.payment_method ?? null,
      });

      return await this.voucherRepo.save(voucher);
    } catch (error) {
      if (this.isForeignKeyViolation(error)) {
        throw new InternalServerErrorException(
          `Failed to create voucher for request ${data.id_request}`,
        );
      }

      throw error;
    }
  }

  private isForeignKeyViolation(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const databaseError = error as {
      code?: string;
      driverError?: { code?: string; message?: string };
      message?: string;
    };

    return (
      databaseError.code === '23503' ||
      databaseError.driverError?.code === '23503' ||
      databaseError.message?.includes('violates foreign key constraint') ||
      databaseError.driverError?.message?.includes('violates foreign key constraint')
    );
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
   *        data (UpdateVoucherDto) - optional fields to apply (class, amount, currency,
   *        tax_type, date, file_url_pdf, file_url_xml, status, id_request).
   * Output: Promise<Voucher> - the voucher entity after applying the updates.
   */
  async update(id: string, data: UpdateVoucherDto): Promise<Voucher> {
    const existingVoucher = await this.findOne(id); // Ensure we find the voucher first

    const updatedVoucherData = {
      // Update only provided fields
      id_request:data.id_request ?? existingVoucher.id_request, // Use existing if not provided
      class: data.class ?? existingVoucher.class, // Use existing if not provided
      amount: data.amount ?? existingVoucher.amount, // Use existing if not provided
      tax_type: data.tax_type ?? existingVoucher.tax_type, // Use existing if not provided
      currency: data.currency ?? existingVoucher.currency, // Use existing if not provided
      date: data.date ? new Date(data.date) : existingVoucher.date, // Update only if new date is provided
      file_url_pdf: data.file_url_pdf ?? existingVoucher.file_url_pdf, // Use existing if not provided
      file_url_xml: data.file_url_xml ?? existingVoucher.file_url_xml, // Use existing if not provided
      status: data.status ?? existingVoucher.status,
    };

    // Now update and return the updated entity
    await this.voucherRepo.update(id, updatedVoucherData);
    return this.findOne(id); // Return the updated entity
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
    // 1) run the update
    const result: UpdateResult = await this.voucherRepo.update(id, {
      status: 'Voucher Approved',         // ← your “determined value” here
    });

    // 2) if nothing was affected, the id didn’t exist
    if (result.affected === 0) {
      throw new BadRequestException(`Voucher with ID ${id} not found`);
    }

    // 3) return a success payload
    return {
      status: true,
      message: `Voucher ${id} approved`,
    };
  }
  /**
   * deny - Sets a voucher's status to 'Voucher Denied'.
   * Input: id (string) - UUID of the voucher to deny.
   * Output: Promise<{ status: boolean; message: string }> - success flag and confirmation message.
  * Throws BadRequestException if no voucher with the given ID exists.
   */  
  async deny(id: string): Promise<{ status: boolean; message: string }> {
    // 1) run the update
    const result: UpdateResult = await this.voucherRepo.update(id, {
      status: 'Voucher Denied',         // ← your “determined value” here
    });

    // 2) if nothing was affected, the id didn’t exist
    if (result.affected === 0) {
      throw new BadRequestException(`Voucher with ID ${id} not found`);
    }

    // 3) return a success payload
    return {
      status: true,
      message: `Voucher ${id} denied`,
    };
  }

  /**
   * findByRequest - Retrieves all vouchers linked to a specific travel request.
   * Input: requestId (string) - UUID of the travel request to filter vouchers by.
   * Output: Promise<Voucher[]> - array of vouchers associated with the given request.
  * Throws BadRequestException if no vouchers exist for the given request ID.
   */
  async findByRequest(requestId: string): Promise<Voucher[]> {
    const vouchers = await this.voucherRepo.find({
      where: { id_request: requestId},
    });
    if (vouchers.length === 0) {
      throw new BadRequestException(
        `No vouchers found for Request ID ${requestId}`
      );
    }
    return vouchers;
  }
}
