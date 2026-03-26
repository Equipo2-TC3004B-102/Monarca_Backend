/**
 * FileName: create-destination.dto.ts
 * Description: Data Transfer Object for creating a destination. Validates that
 *              country and city are strings with a length between 2 and 100 characters.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateDestinationDto {
  @ApiProperty({
    description: 'Country of Destination',
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
