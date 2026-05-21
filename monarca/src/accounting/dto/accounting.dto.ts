/**
 * FileName: accounting.dto.ts
 * Description: DTOs for the accounting module. Covers catalog GL-account updates,
 *              concept-to-GL mappings, and company comp_code configuration.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 20/05/2026 [Julio Rodriguez] Created DTOs.
 */

import { IsOptional, IsString, MaxLength, IsNotEmpty } from 'class-validator';

export class UpdateAccountingCatalogDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  gl_advance?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  gl_cxp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  gl_iva?: string;
}

export class UpsertAccountingConceptDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  concept: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  gl_account: string;
}

export class SetCompCodeDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  comp_code: string;
}
