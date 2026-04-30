/**
 * FileName: import-user.dto.ts
 * Description: DTO for bulk user import from JSON. Accepts only the fields
 *              defined by the admin import format. Password, role, and flags
 *              are derived automatically by the import service.
 * Authors: DebugStudio Team
 * 29/04/2026 [Julio Rodriguez] manager_id → IsString (employee_num ref); removed id_ceco — assigned via admin UI.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

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

  @ApiProperty({ example: 'EMP-002', required: false })
  @IsString()
  @IsOptional()
  manager_id?: string | null;

  @ApiProperty({ example: 'PROV-MX-001', required: false })
  @IsString()
  @IsOptional()
  provider?: string | null;

  @ApiProperty({ example: 'active' })
  @IsString()
  status: string;

  @ApiProperty({ example: '2026-01-10', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  creation_date?: Date;
}
