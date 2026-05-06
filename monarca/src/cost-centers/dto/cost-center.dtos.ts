/**
 * FileName: cost-center.dtos.ts
 * Description: Data Transfer Objects for cost center operations. Includes
 *              CreateCostCenterDto with required validations, UpdateCostCenterDto
 *              extending Create with all fields optional, and CostCenterDto
 *              for responses. The id field is a human-readable code provided by
 *              the caller (e.g. "TEC-001"), matching the entity primary key type.
 * Authors: Juan Pablo Narchi
 * Last Modification made:
 * 05/05/2026 [Juan Pablo Narchi] Created DTOs for Cost Centers CRUD operations.
 */

import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { CostCenter } from '../entity/cost-centers.entity';

// CreateCostCenterDto requires id and id_company. The id is a caller-provided
// human-readable code (varchar PK). The name field is optional because the
// entity column allows nulls. Used as input for POST /cost-centers.
export class CreateCostCenterDto {
  @ApiProperty({
    description: 'Cost center identifier (human-readable code, primary key)',
    example: 'TEC-001',
  })
  @IsNotEmpty()
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'Cost center name',
    example: 'Finanzas',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string | null;

  @ApiProperty({
    description: 'Company id the cost center belongs to',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsNotEmpty()
  @IsUUID()
  id_company!: string;
}

// UpdateCostCenterDto allows partial updates. CostCenterDto mirrors the entity for response shape.
export class UpdateCostCenterDto extends PartialType(CreateCostCenterDto) {}

export class CostCenterDto extends OmitType(CostCenter, [] as const) {}
