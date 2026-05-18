/**
 * FileName: compare-request.dto.ts
 * Description: DTO for comparing selected flight offers returned by providers.
 * Authors: Debug Studio (Diego de la Vega)
 * Last Modification made:
 * 06/05/2026 [Diego de la Vega] Created comparison request DTO with the help of Github Copilot.
 */

import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { ProviderFlightQueryDto } from './provider-flight-query.dto';

export class SelectedOfferDto {
  @ApiProperty({ example: 'duffel' })
  @IsNotEmpty()
  provider_id: string;

  @ApiProperty({ example: 'off_123' })
  @IsNotEmpty()
  provider_offer_id: string;
}

export class CompareRequestDto {
  @ApiProperty({ type: [SelectedOfferDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SelectedOfferDto)
  selected: SelectedOfferDto[];

  @ApiProperty({ required: false, type: ProviderFlightQueryDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProviderFlightQueryDto)
  query?: ProviderFlightQueryDto;
}