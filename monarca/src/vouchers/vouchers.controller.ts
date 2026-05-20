/**
 * FileName: vouchers.controller
 * Description: REST controller for Voucher operations. Exposes endpoints for
 *              uploading, retrieving, updating, approving, and denying vouchers.
 *              Also exposes a parse-only endpoint (ST-3) for XML extraction testing.
 *              All routes are protected by AuthGuard and PermissionsGuard.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 17/05/2026 [Santiago Coronado Hernández, Juan Pablo Narchi and Fausto Izquierdo] Added parsedCFDI extraction to the uploadVoucher endpoint. 
 * Also changed pdf and xml field names to be accepted in both file_url_pdf/file_url_xml and pdf/xml for better flexibility. 
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
import { CreateVoucherDto } from './dto/create-voucher-dto';
import { UpdateVoucherDto } from './dto/update-voucher-dto';
import { Voucher } from './entities/vouchers.entity';
import { ApiTags } from '@nestjs/swagger';
import { UploadPdfInterceptor } from 'src/utils/interceptor.middleware';
import { UseInterceptors, UploadedFiles, InternalServerErrorException } from '@nestjs/common';
import { RequestInterface } from 'src/guards/interfaces/request.interface';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { Permissions } from 'src/guards/decorators/permission.decorator';

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
   * Input: files – multipart upload with field name 'file_url_xml' or 'xml'.
   * Output: Promise<ParsedCfdi> – the raw fiscal data extracted from the CFDI.
   * Throws BadRequestException if no XML file is provided or parsing fails.
   */
  @UseInterceptors(UploadPdfInterceptor())
  @Post('parse-xml')
  @HttpCode(200)
  async parseXml(
    @UploadedFiles()
    files: { 
      file_url_xml?: Express.Multer.File[];
      xml?: Express.Multer.File[];
    },
  ): Promise<ReturnType<XmlParserService['parse']>> {
    // Support both old field name (file_url_xml) and new field name (xml)
    const xmlFile = files?.file_url_xml?.[0] || files?.xml?.[0];
    if (!xmlFile) {
      throw new BadRequestException('An XML file is required in the file_url_xml or xml field.');
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
  @Permissions('upload_vouchers') // Add appropriate permission for uploading vouchers.
  @HttpCode(200)
  async uploadVoucher(
    @Req() req: RequestInterface,
    @UploadedFiles()
    files: {
      file_url_pdf?: Express.Multer.File[];
      file_url_xml?: Express.Multer.File[];
      pdf?: Express.Multer.File[];
      xml?: Express.Multer.File[];
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
    
    // Normalize field names: support both old (file_url_xml/file_url_pdf) and new (xml/pdf) field names
    const xmlFile = files.file_url_xml?.[0] || files.xml?.[0];
    const parsedCfdi = xmlFile
      ? this.xmlParserService.parse(fs.readFileSync(xmlFile.path))
      : undefined;

    // flatten both old and new field names into one list
    const uploaded = [
      ...(files.file_url_pdf || []),
      ...(files.file_url_xml || []),
      ...(files.pdf || []),
      ...(files.xml || []),
    ];

    for (const file of uploaded) {
      const publicUrl = `${baseDownloadLink}${pathToVocuherDownload}${file.filename}`;
      // Normalize field names to standard names for service layer
      if (file.fieldname === 'file_url_pdf' || file.fieldname === 'pdf') {
        fileMap.file_url_pdf = publicUrl;
      } else if (file.fieldname === 'file_url_xml' || file.fieldname === 'xml') {
        fileMap.file_url_xml = publicUrl;
      }
    }

    return this.vouchersService.create(
      id_user,
      { ...dto, ...fileMap },
      parsedCfdi,
    );
  }

  /**
   * findAll - Retrieves all vouchers stored in the database.
   * Input: None
   * Output: Promise<Voucher[]> - array of all voucher records.
   */
  @Get()
  @Permissions('view_assigned_requests_readonly') // Add appropriate permission for retrieving vouchers.
  async findAll(): Promise<Voucher[]> {
    return this.vouchersService.findAll();
  }

  /**
   * findByRequest - Retrieves all vouchers linked to a specific travel request.
   * Input: requestId (string) - UUID of the travel request to filter vouchers by.
   * Output: Promise<Voucher[]> - array of vouchers associated with the given request ID.
   */
  @Get(':requestId')
  @Permissions('view_assigned_requests_readonly') // Add appropriate permission for retrieving vouchers.
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
  @Permissions('upload_vouchers') // Add appropriate permission for updating vouchers.
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
  @Permissions('approve_vouchers') // Add appropriate permission for approving vouchers.
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
  @Permissions('deny_vouchers') // Add appropriate permission for denying vouchers.
  async deny(
    @Param('id') id: string,
  ): Promise<{ status: boolean; message: string }> {
    return this.vouchersService.deny(id);
  }

}
