/**
 * FileName: unified-flight-option.dto.ts
 * Description: Provider-agnostic DTOs for normalized flight options returned by
 *              travel provider adapters.
 * Authors: DebugStudio (Diego de la Vega)
 * Last Modification made:
 * 22/04/2026 [Diego de la Vega] Created normalized flight option and error contracts to define how will the endpoint respond.
 */

import { ApiProperty } from '@nestjs/swagger';
import { ProviderFlightQueryDto } from './provider-flight-query.dto';

export class UnifiedFlightSegmentDto {
  @ApiProperty({ example: 'MEX' })
  origin_airport_code: string;

  @ApiProperty({ example: 'Ciudad de Mexico' })
  origin_city: string;

  @ApiProperty({ example: 'CUN' })
  destination_airport_code: string;

  @ApiProperty({ example: 'Cancun' })
  destination_city: string;

  @ApiProperty({ example: '2026-05-20T14:30:00Z' })
  departure_at: string;

  @ApiProperty({ example: '2026-05-20T17:05:00Z' })
  arrival_at: string;
}

export class UnifiedFlightOptionDto {
  @ApiProperty({ example: 'off_123' })
  provider_offer_id: string;

  @ApiProperty({ example: 'duffel' })
  provider_id: string;

  @ApiProperty({ example: 'Duffel' })
  provider_name: string;

  @ApiProperty({ example: 4250.75 })
  total_price_mxn: number;

  @ApiProperty({ example: 250.25, required: false })
  original_price?: number;

  @ApiProperty({ example: 'USD', required: false })
  original_currency?: string;

  @ApiProperty({ example: 'Aeromexico', required: false })
  airline?: string;

  @ApiProperty({ example: 0, required: false })
  stops?: number;

  @ApiProperty({ type: [UnifiedFlightSegmentDto] })
  segments: UnifiedFlightSegmentDto[];
}

export class ProviderErrorDto {
  @ApiProperty({ example: 'duffel' })
  provider_id: string;

  @ApiProperty({ example: 'Duffel' })
  provider_name: string;

  @ApiProperty({ example: 'PROVIDER_DUFFEL_TIMEOUT' })
  code: string;

  @ApiProperty({ example: 'Duffel provider timed out while searching flights' })
  message: string;
}

export class UnifiedFlightSearchResponseDto {
  @ApiProperty({ type: [UnifiedFlightOptionDto] })
  results: UnifiedFlightOptionDto[];

  @ApiProperty({ type: [ProviderErrorDto] })
  provider_errors: ProviderErrorDto[];

  @ApiProperty({ type: ProviderFlightQueryDto, required: false })
  query?: ProviderFlightQueryDto;

  @ApiProperty({ example: 4 })
  results_count: number;

  @ApiProperty({ example: ['duffel'] })
  providers_used: string[];

  @ApiProperty({ example: false })
  partial_success: boolean;
}