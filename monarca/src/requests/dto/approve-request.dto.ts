import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class ApproveRequestDTO {
  @ApiProperty({
    description: 'Travel Agency Id — required only for the final approval level.',
    example: 'travel-agency-uuid-000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  id_travel_agency?: string;
}
