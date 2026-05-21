/**
 * FileName: admin.dto.ts
 * Description: DTOs for admin-specific operations not covered by existing entity DTOs.
 *              Includes SetCompanyAdminDto for toggling the is_company_admin flag,
 *              FindUsersQueryDto for filtering user lists, CompanySetupDto for
 *              creating a company with its initial admin user in one operation,
 *              and UpdateCompanySettingsDto for company-level policy configuration.
 * Authors: DebugStudio Team
 * Last Modification:
 * 29/04/2026 [Julio Rodriguez] Added CompanySetupAdminDto and CompanySetupDto.
 * 19/05/2026 [Julio Rodriguez] Added UpdateCompanySettingsDto.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

// Class used for setting user flags (is_requester, is_approver, etc.) in user management endpoints
export class SetUserFlagsDto {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  is_requester?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  is_approver?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  is_soi?: boolean;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  is_travelAgent?: boolean;
}

export class SetCompanyAdminDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  is_company_admin: boolean;
}

// Query for filtering users in admin endpoints

export class FindUsersQueryDto {
  @ApiProperty({ example: 'Juan', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'juan@example.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'EMP-001', required: false })
  @IsString()
  @IsOptional()
  employee_num?: string;
}

// Creates the initial company admin user as part of the company setup process. The admin user is created with the is_company_admin flag set to true and approver permissions by default.
export class CompanySetupAdminDto {
  @ApiProperty({ example: 'Roberto' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'García', required: false })
  @IsString()
  @IsOptional()
  last_name?: string;

  @ApiProperty({ example: 'admin@monarcamx.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'EMP-ADMIN-01', required: false })
  @IsString()
  @IsOptional()
  employee_num?: string;
}

// Company-level policy settings editable by company admins and system admins.
export class UpdateCompanySettingsDto {
  @ApiProperty({ example: 7 })
  @IsInt()
  @Min(1)
  voucher_deadline_days: number;
}

// Only for Ditta admin use, creates a company and its initial admin user in one operation.
export class CompanySetupDto {
  @ApiProperty({ example: 'Monarca México' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MXN' })
  @IsString()
  local_currency: string;

  @ApiProperty({ type: CompanySetupAdminDto })
  @ValidateNested()
  @Type(() => CompanySetupAdminDto)
  admin: CompanySetupAdminDto;
}