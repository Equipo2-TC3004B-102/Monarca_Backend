/**
 * FileName: create-voucher-dto
 * Description: Data Transfer Object for creating a new voucher. Defines and
 *              validates all required and optional fields sent in the request body,
 *              including file URLs and fiscal fields for CFDI integration.
 * Authors: Original Monarca team
 * Last Modification made:
 * 20/04/2026 [fest] Added receiver_name and exchange_rate fiscal fields for CFDI integration.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateVoucherDto {
  @ApiProperty({
    description: 'Identifier of the related travel request',
    example: 'request-uuid-123',
  })
  @IsUUID()
  id_request: string;

  @ApiProperty({
    description: 'Voucher classification or type',
    example: 'GAS Gasolina',
  })
  @IsString()
  class: string;

  @ApiProperty({
    description: 'Monetary amount of the voucher',
    example: 150.0,
  })
  @Transform(({ value }) => value ? parseFloat(value) : value)
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'The type of tax applied',
    example: '15%',
  })
  @IsString()
  tax_type: string;

  @ApiProperty({
    description: 'The currency used',
    example: 'USD',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Date when the voucher was issued',
    example: '2025-04-25T00:00:00.000Z',
  })
  @IsDateString()
  date: string;

  // Added IsString validation for file URLs, which are expected to be strings, and marked as optional since they are injected by the upload interceptor
  @ApiProperty({
    description: 'URL pointing to the stored voucher file',
    example: 'https://storage.example.com/vouchers/voucher-123.pdf',
  })
  @IsOptional()
  @IsString()
  file_url_pdf?: string;

  @ApiProperty({
    description: 'URL pointing to the stored voucher file',
    example: 'https://storage.example.com/vouchers/voucher-123.xml',
  })
  @IsOptional()
  @IsString()
  file_url_xml?: string;

  @ApiProperty({
    description: 'PDF file field name (alternative to file_url_pdf)',
    example: 'File object',
    required: false,
  })
  @IsOptional()
  pdf?: any;

  @ApiProperty({
    description: 'XML file field name (alternative to file_url_xml)',
    example: 'File object',
    required: false,
  })
  @IsOptional()
  xml?: any;

  @ApiProperty({
    description: 'Status of approval',
    example: 'voucher denied',
  })
  @IsString()
  status: string;

  // Updated to allow null values for id_approver, which is consistent with the entity definition and domain model where a voucher may not have an approver assigned at creation
  @ApiProperty({
    description: 'ID of the person in charge of approving the vouchers',
    example: 'd05c8455-c3d5-4a6c-b79b-2d9c695cd674',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  id_approver: string;

  // ──────────────────────────────────────────────
  // Fiscal fields – CFDI integration (Req. 10)
  // ──────────────────────────────────────────────

  @ApiProperty({
    description: 'UUID del Timbre Fiscal Digital from the CFDI XML (36 characters)',
    example: '6F29A520-4C2A-4D3B-9E1F-8A7B6C5D4E3F',
    required: false,
  })
  @IsOptional()
  @IsString()
  fiscal_uuid?: string;

  @ApiProperty({
    description: 'RFC of the invoice issuer (Emisor)',
    example: 'AAA010101AAA',
    required: false,
  })
  @IsOptional()
  @IsString()
  issuer_rfc?: string;

  @ApiProperty({
    description: 'Business name of the invoice issuer (Razón social del Emisor)',
    example: 'Empresa Ejemplo S.A. de C.V.',
    required: false,
  })
  @IsOptional()
  @IsString()
  issuer_name?: string;

  @ApiProperty({
    description: 'RFC of the invoice receiver (Receptor)',
    example: 'BBB020202BBB',
    required: false,
  })
  @IsOptional()
  @IsString()
  receiver_rfc?: string;

  @ApiProperty({
    description: 'Business name of the invoice receiver (Razón social del Receptor)',
    example: 'Cliente Ejemplo S.A. de C.V.',
    required: false,
  })
  @IsOptional()
  @IsString()
  receiver_name?: string;

  @ApiProperty({
    description: 'CFDI exchange rate (Tipo de cambio)',
    example: 17.1234,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : value)
  @IsNumber()
  exchange_rate?: number;

  @ApiProperty({
    description: 'Subtotal amount before taxes',
    example: 1000.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : value)
  @IsNumber()
  subtotal?: number;

  @ApiProperty({
    description: 'Total discount amount of the CFDI voucher',
    example: 100.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : value)
  @IsNumber()
  discount?: number;

  @ApiProperty({
    description: 'Transferred IVA tax amount (SAT tax code 002)',
    example: 160.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : value)
  @IsNumber()
  iva_trasladado?: number;

  @ApiProperty({
    description: 'Transferred IEPS tax amount (SAT tax code 003)',
    example: 40.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : value)
  @IsNumber()
  ieps_trasladado?: number;

  @ApiProperty({
    description: 'Retained ISR tax amount (SAT tax code 001)',
    example: 20.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : value)
  @IsNumber()
  isr_retenido?: number;

  @ApiProperty({
    description: 'Retained IVA tax amount (SAT tax code 002)',
    example: 50.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : value)
  @IsNumber()
  iva_retenido?: number;

  @ApiProperty({
    description: 'SAT payment form code (e.g., 01)',
    example: '01',
    required: false,
  })
  @IsOptional()
  @IsString()
  payment_form?: string;

  @ApiProperty({
    description: 'SAT payment method code (e.g., PUE)',
    example: 'PUE',
    required: false,
  })
  @IsOptional()
  @IsString()
  payment_method?: string;
}

