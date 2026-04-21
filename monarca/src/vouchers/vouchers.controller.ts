/**
 * FileName: vouchers.controller
 * Description: REST controller for Voucher operations. Exposes endpoints for
 *              uploading, retrieving, updating, approving, and denying vouchers.
 *              Also exposes a parse-only endpoint (ST-3) for XML extraction testing.
 *              All routes are protected by AuthGuard and PermissionsGuard.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 19/04/2026 [Fausto Izquierdo] Added POST /vouchers/parse-xml endpoint for ST-3
 *                               XML extraction testing (no DB persistence).
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Req,
  UseGuards,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs';
import { VouchersService } from './vouchers.service';
import { XmlParserService } from './services/xml-parser.service';
import { ParsedCfdi } from './interfaces/parsed-cfdi.interface';
import { CreateVoucherDto } from './dto/create-voucher-dto';
import { UpdateVoucherDto } from './dto/update-voucher-dto';
import { Voucher } from './entities/vouchers.entity';
import { ApiTags } from '@nestjs/swagger';
import { UploadPdfInterceptor } from 'src/utils/interceptor.middleware';
import { UseInterceptors, UploadedFiles, InternalServerErrorException } from '@nestjs/common';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';

@UseGuards(AuthGuard, PermissionsGuard)
@ApiTags('Vouchers') // Swagger documentation tag for the controller
@Controller('vouchers')
export class VouchersController {
  constructor(
    private readonly vouchersService: VouchersService,
    private readonly xmlParserService: XmlParserService,
  ) {}

  /**
   * parseXml – ST-3 test endpoint. Receives an XML file, runs XmlParserService,
   *            and returns the extracted ParsedCfdi JSON without saving anything.
   * Input: files – multipart upload with field name 'file_url_xml'.
   * Output: Promise<ParsedCfdi> – the raw fiscal data extracted from the CFDI.
   * Throws BadRequestException if no XML file is provided or parsing fails.
   */
  @UseInterceptors(UploadPdfInterceptor())
  @Post('parse-xml')
  @HttpCode(200)
  async parseXml(
    @UploadedFiles()
    files: { file_url_xml?: Express.Multer.File[] },
  ): Promise<ParsedCfdi> {
    const xmlFile = files?.file_url_xml?.[0];
    if (!xmlFile) {
      throw new BadRequestException('An XML file is required in the file_url_xml field.');
    }
    // Multer uses diskStorage so the file is on disk, not in memory
    const buffer = fs.readFileSync(xmlFile.path);
    return this.xmlParserService.parse(buffer);
  }

  /**
   * uploadVoucher - Handles PDF/XML file upload and creates a new voucher record.
   * Input: req (RequestInterface) - session info used to extract the authenticated user ID;
   *        files - uploaded PDF and/or XML files via multipart form data;
   *        dto (CreateVoucherDto) - voucher metadata (class, amount, currency, tax type, date, status).
   * Output: Promise<Voucher> - the newly created and persisted voucher record.
   */
  @UseInterceptors(UploadPdfInterceptor())
  @Post('upload')
  @HttpCode(200)
  async uploadVoucher(
    @Req() req: RequestInterface,
    @UploadedFiles()
    files: {
      file_url_pdf?: Express.Multer.File[];
      file_url_xml?: Express.Multer.File[];
    },
    @Body() dto: CreateVoucherDto,
  ) {

    const baseDownloadLink = process.env.DOWNLOAD_LINK;
    const pathToVocuherDownload= "/files/vouchers/";
    if (!baseDownloadLink) {
      throw new InternalServerErrorException('DOWNLOAD_LINK not configured');
    }

    const id_user = req.sessionInfo.id; 
    const fileMap: Record<string, string> = {};

    // flatten both arrays into one list
    const uploaded = [
      ...(files.file_url_pdf || []),
      ...(files.file_url_xml || []),
    ];

    for (const file of uploaded) {
      const publicUrl = `${baseDownloadLink}${pathToVocuherDownload}${file.filename}`;
      if (file.fieldname === 'file_url_pdf') {
        fileMap.file_url_pdf = publicUrl;
      } else if (file.fieldname === 'file_url_xml') {
        fileMap.file_url_xml = publicUrl;
      }
    }

    return this.vouchersService.create(
      id_user,
      {...dto, ...fileMap}
    );
  }

  /**
   * findAll - Retrieves all vouchers stored in the database.
   * Input: None
   * Output: Promise<Voucher[]> - array of all voucher records.
   */
  @Get()
  async findAll(): Promise<Voucher[]> {
    return this.vouchersService.findAll();
  }

  /**
   * findByRequest - Retrieves all vouchers linked to a specific travel request.
   * Input: requestId (string) - UUID of the travel request to filter vouchers by.
   * Output: Promise<Voucher[]> - array of vouchers associated with the given request ID.
   */
  @Get(':requestId')
  async findByRequest(
    @Param('requestId') requestId: string
  ): Promise<Voucher[]> {
    return this.vouchersService.findByRequest(requestId);
  }
  

  /**
   * update - Partially updates an existing voucher's fields by its UUID.
   * Input: id (string) - UUID of the voucher to update;
   *        updateVoucherDto (UpdateVoucherDto) - optional fields to apply (all fields are optional).
   * Output: Promise<Voucher> - the updated voucher record.
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
  ): Promise<Voucher> {
    return this.vouchersService.update(id, updateVoucherDto);
  }


  /**
   * approve - Marks a voucher as approved by updating its status field.
   * Input: id (string) - UUID of the voucher to approve.
   * Output: Promise<{ status: boolean; message: string }> - success flag and confirmation message.
   */
  @Patch(':id/approve')
  async approve(
    @Param('id') id: string,
  ): Promise<{ status: boolean; message: string }> {
    return this.vouchersService.approve(id);
  }

  /**
   * deny - Marks a voucher as denied by updating its status field.
   * Input: id (string) - UUID of the voucher to deny.
   * Output: Promise<{ status: boolean; message: string }> - success flag and confirmation message.
   */
  @Patch(':id/deny')
  async deny(
    @Param('id') id: string,
  ): Promise<{ status: boolean; message: string }> {
    return this.vouchersService.deny(id);
  }

}
