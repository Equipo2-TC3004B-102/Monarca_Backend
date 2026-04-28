/**
 * FileName: approval-level.dto.ts
 * Description: Data Transfer Objects for ApprovalLevel CRUD operations.
 *              CreateApprovalLevelDto validates required and optional fields on creation.
 *              UpdateApprovalLevelDto extends Create with all fields optional.
 * Authors: DebugStudio Team
 * Last Modification: 23/04/2026 [Julio Rodríguez] Created DTOs for ApprovalLevel CRUD.
 */

import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateApprovalLevelDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  company_id: string;

  @ApiProperty({ example: 'L1' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Manager Approval' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Requires manager approval for amounts above $10,000 MXN', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'travel', required: false })
  @IsString()
  @IsOptional()
  applies_to?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  level_order: number;

  @ApiProperty({ example: 10000, required: false })
  @IsNumber()
  @IsOptional()
  min_amount_mon?: number;

  @ApiProperty({ example: 50000, required: false })
  @IsNumber()
  @IsOptional()
  max_amount_mon?: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  required_approvals?: number;

  @ApiProperty({ example: 24, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  escalation_hours?: number;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class UpdateApprovalLevelDto extends PartialType(CreateApprovalLevelDto) {}
