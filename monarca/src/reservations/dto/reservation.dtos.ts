/**
 * FileName: reservation.dtos
 * Description: Data Transfer Objects for Reservation operations. Defines and validates
 *              fields for creating (CreateReservationDto) and updating (UpdateReservationDto)
 *              reservations, and exposes the entity shape as ReservationDto.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 14/05/2026 [Julio Rodriguez] Added @Type(() => Number) to price field so FormData strings are
 *                              coerced to numbers before @IsNumber() validation.
 */

import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Reservation } from '../entity/reservations.entity';

export class CreateReservationDto {
  @ApiProperty({
    example: 'Taxi reservation',
    description: 'Title of the reservation that is being made',
    required: true,
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Taxi reservation made for the user John Doe, expected arrival at 10:00 AM',
    description: 'Comments or notes about the reservation',
    required: true,
  })
  @IsString()
  comments: string;

  @ApiProperty({
    example: 250.00,
    description: 'Price of the reservation',
    required: true,
  })
  @IsNumber()
  @Type(() => Number)
  price: number;

  @ApiProperty({
    description: 'Optional flight reference or provider link associated with the reservation',
    example: 'off_0000B6Cj8zofoc7k9G4Nal',
    required: false,
  })
  @IsString()
  @IsOptional()
  link?: string;

  @ApiProperty({
    description: 'pdf file of the reservation',
    example: 'file',
  })
  @IsString()
  @IsOptional()
  file?: string;

  @ApiProperty({
    description: 'ID of the request destination',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID()
  id_request_destination: string;
}

export class UpdateReservationDto extends PartialType(CreateReservationDto) {}

export class ReservationDto extends OmitType(Reservation, []) {}
