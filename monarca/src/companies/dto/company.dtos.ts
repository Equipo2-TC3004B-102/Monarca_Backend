/**
 * FileName: company.dtos.ts
 * Description: Data Transfer Objects for company operations. Includes
 *              CreateCompanyDto with required validations, UpdateCompanyDto
 *              extending Create with all fields optional, and CompanyDto
 *              for responses.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 15/04/2026 [Julio Rodriguez] Created DTOs for Companies CRUD operations.
 */

import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Company } from '../entity/company.entity';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Ditta Consulting' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MXN' })
  @IsString()
  local_currency: string;
}

// UpdateCompanyDto allows partial updates like name or local_currency, and CompanyDto is used for responses without modifications.
export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}

export class CompanyDto extends OmitType(Company, []) {}
