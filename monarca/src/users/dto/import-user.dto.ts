/**
 * FileName: import-user.dto.ts
 * Description: DTO for bulk user import from JSON. Accepts only the fields
 *              defined by the admin import format. Password defaults to "password".
 *              If no role flag is provided, is_requester defaults to true.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 04/05/2026 [Julio Rodriguez] Added role flags (is_requester, is_approver, is_soi, is_travelAgent) and id_travel_agency so all user types can be imported from JSON.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class ImportUserDto {
  @ApiProperty({ example: 'EMP-001', required: false })
  @IsString()
  @IsOptional()
  employee_num?: string;

  @ApiProperty({ example: 'Carlos' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'López', required: false })
  @IsString()
  @IsOptional()
  last_name?: string;

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

  @ApiProperty({ example: 'TEC-001', required: false })
  @IsString()
  @IsOptional()
  id_ceco?: string;

  @ApiProperty({ example: 'active' })
  @IsString()
  status: string;

  @ApiProperty({ example: '2026-01-10', required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  creation_date?: Date;

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

  @ApiProperty({ example: '24169971-6d7f-4bf7-982c-dad1aebac579', required: false })
  @IsUUID()
  @IsOptional()
  id_travel_agency?: string;
}
