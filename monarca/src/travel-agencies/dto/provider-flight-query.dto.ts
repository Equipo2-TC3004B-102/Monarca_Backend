/**
 * FileName: provider-flight-query.dto.ts
 * Description: Query DTO used by provider adapters to search flight options in a
 *              provider-agnostic way.
 * Authors: Debug Studio (Diego de la Vega)
 * Last Modification made:
 * 22/04/2026 [Diego de la Vega] Created base query contract for provider adapters. This helps to validate data before sending them to the API.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ProviderFlightQueryDto {
  @ApiProperty({ example: 'MEX' })
  @IsString()
  @IsNotEmpty()
  origin_airport_code: string;

  @ApiProperty({ example: 'CUN' })
  @IsString()
  @IsNotEmpty()
  destination_airport_code: string;

  @ApiProperty({ example: '2026-05-20' })
  @IsDateString()
  departure_date: string;

  @ApiProperty({ example: '2026-05-27', required: false })
  @IsOptional()
  @IsDateString()
  return_date?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  passengers: number;
}