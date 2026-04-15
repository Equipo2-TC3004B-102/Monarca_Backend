/**
 * FileName: create-voucher-dto
 * Description: Data Transfer Object for creating a new voucher. Defines and
 *              validates all required and optional fields sent in the request body,
 *              including file URLs and fiscal fields for CFDI integration.
 * Authors: Original Monarca team
 * Last Modification made:
 * 15/04/2026 [Fausto Izquierdo] Added fiscal fields (uuid, RFCs, subtotal, taxes)
 *            for CFDI invoice data persistence.
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
  @Transform(({ value }) => Number(value))
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

  @ApiProperty({
    description: 'URL pointing to the stored voucher file',
    example: 'https://storage.example.com/vouchers/voucher-123.pdf',
  })
  @IsOptional()
  file_url_pdf?: string;

  @ApiProperty({
    description: 'URL pointing to the stored voucher file',
    example: 'https://storage.example.com/vouchers/voucher-123.xml',
  })
  @IsOptional()
  file_url_xml?: string;

  @ApiProperty({
    description: 'Status of approval',
    example: 'voucher denied',
  })
  @IsString()
  status: string;

  @ApiProperty({
    description: 'ID of the person in charge of approving the vouchers',
    example: 'd05c8455-c3d5-4a6c-b79b-2d9c695cd674',
  })
  @IsString()
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
    description: 'Subtotal amount before taxes',
    example: 1000.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  @IsNumber()
  subtotal?: number;

  @ApiProperty({
    description: 'Total transferred taxes (IVA, IEPS)',
    example: 160.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  @IsNumber()
  tax_amount?: number;

  @ApiProperty({
    description: 'Total retained taxes (ISR, retained IVA)',
    example: 50.0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value != null ? Number(value) : undefined))
  @IsNumber()
  retention_amount?: number;
}

