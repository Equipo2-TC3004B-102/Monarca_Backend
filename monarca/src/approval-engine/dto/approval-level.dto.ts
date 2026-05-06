/**
 * FileName: approval-level.dto.ts
 * Description: Data Transfer Objects for ApprovalLevel CRUD operations.
 *              CreateApprovalLevelDto validates required and optional fields on creation.
 *              UpdateApprovalLevelDto extends Create with all fields optional.
 * Authors: DebugStudio Team
 * Last Modification:
 * 05/05/2026 [Julio Rodriguez] company_id optional (derived from caller for company admins);
 *            added InlineActorDto + actor field to create level and actor in one request.
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
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// New class to allow inline creation of an actor when creating an approval level
export class InlineActorDto {
  @ApiProperty({ example: 'MANAGER' })
  @IsString()
  actor_type: string;

  @ApiProperty({ example: 'USER', required: false })
  @IsString()
  @IsOptional()
  target_type?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsUUID()
  @IsOptional()
  target_id?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @ApiProperty({ example: 'any', required: false })
  @IsString()
  @IsOptional()
  selection_mode?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  required_count?: number;
}

export class CreateApprovalLevelDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false })
  @IsUUID()
  @IsOptional()
  company_id?: string;

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

  // Place the actor of an approval level in the same DTO to allow creating both in one request when needed
  @ApiProperty({ type: InlineActorDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => InlineActorDto)
  actor?: InlineActorDto;
}

export class UpdateApprovalLevelDto extends PartialType(CreateApprovalLevelDto) {}
