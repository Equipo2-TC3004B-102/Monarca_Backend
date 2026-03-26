/**
 * FileName: travel-agency.dtos.ts
 * Description: Data Transfer Objects for travel agency operations. Includes
 *              CreateTravelAgencyDto with name validation, UpdateTravelAgencyDto
 *              extending Create with all fields optional, and TravelAgencyDto
 *              for responses.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { TravelAgency } from '../entities/travel-agency.entity';
import { OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTravelAgencyDto {
  @ApiProperty({
    description: 'The name of the travel agency',
    example: 'Travel Agency',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class UpdateTravelAgencyDto extends PartialType(CreateTravelAgencyDto) {}

export class TravelAgencyDto extends OmitType(TravelAgency, []) {}
