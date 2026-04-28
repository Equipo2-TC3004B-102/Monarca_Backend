/**
 * FileName: admin.dto.ts
 * Description: DTOs for admin-specific operations not covered by existing entity DTOs.
 *              Includes SetCompanyAdminDto for toggling the is_company_admin flag and
 *              FindUsersQueryDto for filtering user lists by name, email, or employee_num.
 * Authors: DebugStudio Team
 * Last Modification: 28/04/2026 [Julio Rodríguez] Created admin DTOs for user management endpoints.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

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