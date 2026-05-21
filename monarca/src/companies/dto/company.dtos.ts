/**
 * FileName: company.dtos.ts
 * Description: Data Transfer Objects for company operations. Includes
 *              CreateCompanyDto with required validations, UpdateCompanyDto
 *              extending Create with all fields optional, and CompanyDto
 *              for responses.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 15/04/2026 [Julio Rodriguez] Created DTOs for Companies CRUD operations.
 * 19/05/2026 [Julio Rodriguez] Added voucher_deadline_days to CreateCompanyDto.
 */

import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Company } from '../entity/company.entity';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Ditta Consulting' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MXN' })
  @IsString()
  local_currency: string;

  @ApiProperty({ example: 7, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  voucher_deadline_days?: number;
}

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class CompanyDto extends OmitType(Company, []) {}
