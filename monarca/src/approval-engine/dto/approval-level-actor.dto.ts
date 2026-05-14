/**
 * FileName: approval-level-actor.dto.ts
 * Description: Data Transfer Objects for ApprovalLevelActor CRUD operations.
 *              CreateApprovalLevelActorDto validates required and optional fields on creation.
 *              UpdateApprovalLevelActorDto extends Create with all fields optional.
 * Authors: DebugStudio Team
 * Last Modification: 23/04/2026 [Julio Rodríguez] Created DTOs for ApprovalLevelActor CRUD.
 * 13/05/2026 [Julio Rodriguez] Fixed ceco_id validator from @IsUUID to @IsString (CECO ids are varchar, not UUIDs).
 */

import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateApprovalLevelActorDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  approval_level_id: string;

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

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  required_count?: number;

  @ApiProperty({ example: 'any', required: false })
  @IsString()
  @IsOptional()
  selection_mode?: string;

  @ApiProperty({ example: 'TEC-001', required: false })
  @IsString()
  @IsOptional()
  ceco_id?: string;

  @ApiProperty({ example: 0, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  escalation_step?: number;
}

export class UpdateApprovalLevelActorDto extends PartialType(CreateApprovalLevelActorDto) {}
