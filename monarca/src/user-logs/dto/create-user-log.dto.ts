/**
 * FileName: create-user-log.dto.ts
 * Description: Data Transfer Object for creating a user log entry. Contains
 *              id_user, date, ip address and a report description.
 * Authors: Original Monarca team
 * Last Modification made:
 * 17/04/2026 [Julio Rodríguez] Updated id_user typing to UUID and added input validations.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsIP,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateUserLogDto {
  @ApiProperty({ example: 'b0f8b5d8-f7b1-46ed-bbfa-4dc59d27824b' })
  @IsUUID()
  id_user: string;

  // Updated to timestamptz in the entity for better timezone handling, so using IsDateString here for validation
  @ApiProperty({ example: '2023-12-01T10:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  // IP address validation added
  @ApiProperty({ example: '192.168.1.1' })
  @IsIP()
  ip: string;

  // Report description for the user log entry
  @ApiProperty({ example: 'User accessed the dashboard' })
  @IsString()
  report: string;
}
