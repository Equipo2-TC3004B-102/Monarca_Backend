/**
 * FileName: create-cost-center.dto.ts
 * Description: Data transfer object for creating a new cost center.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 17/05/2026 [Santiago Coronado Hernández and Juan Pablo Narchi] Created DTO for cost center creation.
 */


import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, Length } from 'class-validator';

export class CreateCostCenterDto {
  @ApiProperty({
    description: 'Human-readable cost center code (e.g., TEC-001)',
    example: 'TEC-001',
  })
  @IsString()
  @Length(1, 50)
  id: string;

  @ApiProperty({
    description: 'Cost center name',
    example: 'Technology Department',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Company identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id_company: string;
}
