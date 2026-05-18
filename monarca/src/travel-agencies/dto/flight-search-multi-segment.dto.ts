/**
 * FileName: flight-search-multi-segment.dto.ts
 * Description: DTO for multi-segment flight searches (e.g., MEX->NYC->CUN->MEX)
 * Authors: Debug Studio (Diego de la Vega)
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FlightSegmentDto {
  @ApiProperty({ example: 'MEX', description: 'Origin airport IATA code' })
  @IsString()
  @IsNotEmpty()
  origin: string;

  @ApiProperty({ example: 'NYC', description: 'Destination airport IATA code' })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({ example: '2026-06-15', description: 'Departure date (YYYY-MM-DD)' })
  @IsDateString()
  departure_date: string;
}

export class FlightSearchMultiSegmentDto {
  @ApiProperty({
    type: [FlightSegmentDto],
    description: 'Array of flight segments. Searches each segment separately.',
    example: [
      { origin: 'MEX', destination: 'NYC', departure_date: '2026-06-15' },
      { origin: 'NYC', destination: 'CUN', departure_date: '2026-06-18' },
      { origin: 'CUN', destination: 'MEX', departure_date: '2026-06-20' },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => FlightSegmentDto)
  @ArrayMinSize(1, { message: 'At least one flight segment is required' })
  slices: FlightSegmentDto[];

  @ApiProperty({ example: 2, description: 'Number of passengers' })
  @IsInt()
  @Min(1)
  passengers: number;
}

/**
 * Response DTO for multi-segment search results.
 * Groups results by segment index.
 */
export class FlightSegmentResultDto {
  segment_index: number;
  route: string; // "MEX -> NYC"
  results: any[]; // UnifiedFlightOptionDto[]
}

export class FlightSearchMultiSegmentResponseDto {
  results_by_segment: FlightSegmentResultDto[];
  provider_errors: any[];
  query: FlightSearchMultiSegmentDto;
  total_segments: number;
}
