/**
 * FileName: create-voucher-dto
 * Description: Data Transfer Object for creating a new voucher. Defines and
 *              validates all required and optional fields sent in the request body,
 *              including file URLs injected by the upload interceptor.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 17/04/2026 [Julio Rodríguez] Updated optional approver/id URL validations for DTO consistency.
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
  id_approver?: string;
}
