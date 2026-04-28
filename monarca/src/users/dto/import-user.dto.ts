/**
 * FileName: import-user.dto.ts
 * Description: DTO for bulk user import from JSON. Accepts only the fields
 *              defined by the admin import format. Password, role, and flags
 *              are derived automatically by the import service.
 * Authors: DebugStudio Team
 * Last Modification: 28/04/2026 [Julio Rodríguez] Created ImportUserDto for JSON bulk import.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class ImportUserDto {
  @ApiProperty({ example: 'EMP-001', required: false })
  @IsString()
  @IsOptional()
  employee_num?: string;

  @ApiProperty({ example: 'Carlos' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'clopez', required: false })
  @IsString()
  @IsOptional()
  user_name?: string;

  @ApiProperty({ example: 'clopez@monarcamx.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: '00000001-0000-4000-8000-000000000002', required: false })
  @IsUUID()
  @IsOptional()
  manager_id?: string | null;

  @ApiProperty({ example: 'PROV-MX-001', required: false })
  @IsString()
  @IsOptional()
  provider?: string | null;

  @ApiProperty({ example: 'a1f4e0e1-1b89-4ccf-9e57-43f4b3d1a001', required: false })
  @IsUUID()
  @IsOptional()
  id_ceco?: string | null;

  @ApiProperty({ example: 'active' })
  @IsString()
  status: string;

  @ApiProperty({ example: '2026-01-10', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  creation_date?: Date;
}
