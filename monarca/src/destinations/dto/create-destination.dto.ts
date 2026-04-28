/**
 * FileName: create-destination.dto.ts
 * Description: Data Transfer Object for creating a destination. Validates that
 *              country and city are strings with a length between 2 and 100 characters.
 * Authors: Original Monarca team
 * Last Modification made:
 * 15/04/2026 [Jin Sik Yoon] Added airport-related fields for multidestination support and CSV migration.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateDestinationDto {
  @ApiProperty({
    description: 'IATA code of destination airport',
    example: 'MAD',
  })
  @IsString()
  @Length(3, 10)
  iata_code: string;

  @ApiProperty({
    description: 'Airport name of destination',
    example: 'Adolfo Suárez Madrid-Barajas Airport',
  })
  @IsString()
  @Length(2, 255)
  airport_name: string;

  @ApiProperty({
    description: 'Country of destination',
    example: 'Spain',
  })
  @IsString()
  @Length(2, 100)
  country: string;

  @ApiProperty({
    description: 'City of destination',
    example: 'Madrid',
  })
  @IsString()
  @Length(2, 100)
  city: string;
}