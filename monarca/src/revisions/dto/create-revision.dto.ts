/**
 * FileName: create-revision.dto
 * Description: Data Transfer Object for creating a new revision. Defines and validates
 *              the fields required when an admin submits feedback comments on a travel request.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsUUID,
  IsString,
  IsBoolean,
  IsOptional,
  IsArray,
  IsInt,
  IsDateString,
  ValidateNested,
} from 'class-validator';

export class CreateRevisionDto {
  @ApiProperty({
    description: 'Request id',
    example: 'request-uuid-000',
  })
  @IsUUID()
  id_request: string;

  @ApiProperty({
    description: 'Comments on the request',
    example: 'Change the last destination to LA.',
  })
  @IsString()
  comment: string;
}
