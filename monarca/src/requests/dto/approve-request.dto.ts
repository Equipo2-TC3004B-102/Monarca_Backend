/**
 * approve-request.dto.ts
 * Description: Data Transfer Object used when approving a travel request.
 * Contains the travel agency UUID that will be assigned to handle the request's reservations.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import { ApiProperty } from '@nestjs/swagger';

import { IsUUID } from 'class-validator';

export class ApproveRequestDTO {
  @ApiProperty({
    description: 'Travel Agency Id',
    example: 'travel-agency-uuid-000',
  })
  @IsUUID()
  id_travel_agency: string;
}
