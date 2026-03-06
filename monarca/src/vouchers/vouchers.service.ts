/**
 * FileName: vouchers.service
 * Description: Business logic layer for Voucher operations. Handles creation,
 *              retrieval, update, deletion, approval, and denial of vouchers.
 *              Enforces ownership rules and validates referenced request existence.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { Injectable, NotFoundException,ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { CreateVoucherDto } from './dto/create-voucher-dto';
import { UpdateVoucherDto } from './dto/update-voucher-dto';
import { Voucher } from './entities/vouchers.entity';
import { Request } from 'src/requests/entities/request.entity';
import { privateDecrypt } from 'crypto';
@Injectable()
export class VouchersService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(Request)
    private readonly rRepo: Repository<Request>,
  ) {}

  /**
   * create - Creates and persists a new voucher. Validates that the referenced
   *          request exists and that the caller is the owner of that request.
   * Input: id_user (string) - UUID of the authenticated user creating the voucher;
   *        data (CreateVoucherDto) - voucher fields: id_request, class, amount,
   *        currency, tax_type, date, file_url_pdf, file_url_xml, status.
   * Output: Promise<Voucher> - the newly saved voucher entity.
   * Throws NotFoundException if the referenced request does not exist.
   * Throws ForbiddenException if the caller is not the request owner.
   */
  async create(id_user:string, data: CreateVoucherDto): Promise<Voucher> {
    const request = await this.rRepo.findOne({
      where: { id: data.id_request },
    });
    if (!request) {
      throw new NotFoundException(
        `RequestDestination ${data.id_request} not found`,
      );
    }
    const approverId = request.id_admin;
    const id_creator= request.id_user;
    if (id_user !== id_creator) {
      throw new ForbiddenException(
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
   * Throws NotFoundException if no voucher with the given ID exists.
   */
  async findOne(id: string): Promise<Voucher> {
    const voucher = await this.voucherRepo.findOne({ where: { id } });
    if (!voucher) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
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
   * Throws NotFoundException if no voucher with the given ID exists.
   */
  async remove(id: string): Promise<{ status: boolean; message: string }> {
    const result = await this.voucherRepo.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
    }
    return { status: true, message: `Voucher with ID ${id} removed` };
  }
  /**
   * approve - Sets a voucher's status to 'Voucher Approved'.
   * Input: id (string) - UUID of the voucher to approve.
   * Output: Promise<{ status: boolean; message: string }> - success flag and confirmation message.
   * Throws NotFoundException if no voucher with the given ID exists.
   */  
  async approve(id: string): Promise<{ status: boolean; message: string }> {
    // 1) run the update
    const result: UpdateResult = await this.voucherRepo.update(id, {
      status: 'Voucher Approved',         // ← your “determined value” here
    });

    // 2) if nothing was affected, the id didn’t exist
    if (result.affected === 0) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
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
   * Throws NotFoundException if no voucher with the given ID exists.
   */  
  async deny(id: string): Promise<{ status: boolean; message: string }> {
    // 1) run the update
    const result: UpdateResult = await this.voucherRepo.update(id, {
      status: 'Voucher Denied',         // ← your “determined value” here
    });

    // 2) if nothing was affected, the id didn’t exist
    if (result.affected === 0) {
      throw new NotFoundException(`Voucher with ID ${id} not found`);
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
   * Throws NotFoundException if no vouchers exist for the given request ID.
   */
  async findByRequest(requestId: string): Promise<Voucher[]> {
    const vouchers = await this.voucherRepo.find({
      where: { id_request: requestId},
    });
    if (vouchers.length === 0) {
      throw new NotFoundException(
        `No vouchers found for Request ID ${requestId}`
      );
    }
    return vouchers;
  }
}
