/**
 * FileName: admin.dto.ts
 * Description: DTOs for admin-specific operations not covered by existing entity DTOs.
 *              Includes SetCompanyAdminDto for toggling the is_company_admin flag and
 *              FindUsersQueryDto for filtering user lists by name, email, or employee_num.
 * Authors: DebugStudio Team
 * Last Modification: 26/04/2026 [Julio Rodríguez] Created admin DTOs for user management endpoints.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

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