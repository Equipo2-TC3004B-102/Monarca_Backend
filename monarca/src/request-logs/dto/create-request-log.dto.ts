/**
 * FileName: create-request-log.dto.ts
 * Description: Data Transfer Object for creating a request log entry. Validates
 *              id_request and id_user as UUIDs, new_status as a string, and
 *              optionally report as a string and change_date as a date string.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateRequestLogDto {
  @ApiProperty({
    description: 'Request being logged',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID()
  id_request: string;

  @ApiProperty({
    description: 'User who made the change',
    example: 'user-uuid-666',
  })
  @IsUUID()
  id_user: string;

  @ApiProperty({
    description: 'Descriptive report of the change (e.g., "Editó")',
    example: 'Editó',
    required: false,
  })
  @IsOptional()
  @IsString()
  report?: string;

  @ApiProperty({
    description: 'Status after the change',
    example: 'approved',
  })
  @IsString()
  new_status: string;

  @ApiProperty({
    description: 'Date and time when the change occurred',
    example: '2025-04-17T22:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  change_date?: string;
}
