/**
 * FileName: approval-rule.dto.ts
 * Description: Data Transfer Objects for ApprovalRule CRUD via /rules endpoints.
 *              company_id is derived from the caller's JWT — not accepted in the request body.
 * Authors: DebugStudio Team
 * Last Modification:
 * 05/05/2026 [Julio Rodriguez] Added class-validator decorators and @ApiProperty; removed company_id from body.
 */

import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateApprovalRuleDto {
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

export class UpdateApprovalRuleDto extends PartialType(CreateApprovalRuleDto) {}
