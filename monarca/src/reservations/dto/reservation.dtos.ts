/**
 * FileName: reservation.dtos
 * Description: Data Transfer Objects for Reservation operations. Defines and validates
 *              fields for creating (CreateReservationDto) and updating (UpdateReservationDto)
 *              reservations, and exposes the entity shape as ReservationDto.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Length,
  IsDateString,
  isNotEmpty,
  IsOptional,
  IsInstance,
} from 'class-validator';
import { Reservation } from '../entity/reservations.entity';

export class CreateReservationDto {
  @ApiProperty({
    example: 'Taxi reservation',
    description: 'Title of the reservation that is being made',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example:
      'Taxi reservation made for the user John Doe, expected arrival at 10:00 AM',
    description: 'Comments or notes about the reservation',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  comments: string;

  @ApiProperty({
    example:
      '250.00',
    description: 'Price of the reservation',
    required: true,
  })
  @IsNotEmpty()
  price: number;

  @ApiProperty({
      description: 'pdf file of the reservation',
      example: 'file',
    })
   @IsOptional()
    file?: string;


  @ApiProperty({
    description: 'ID of the request destination',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  id_request_destination: string;
}

export class UpdateReservationDto extends PartialType(CreateReservationDto) {}

export class ReservationDto extends OmitType(Reservation, []) {}
