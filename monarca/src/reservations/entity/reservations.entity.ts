/**
 * FileName: reservations.entity
 * Description: TypeORM entity representing the 'reservations' database table. Defines
 *              all columns and the ManyToOne relationship to the RequestsDestination entity.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 23/04/2026 [Julio Rodríguez] Fixed requestDestination relation type typo.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RequestsDestination } from '../../requests/entities/requests-destination.entity';

@Entity('reservations')
export class Reservation {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Flight MEX-MTY AA123' })
  @Column({ type: 'varchar', nullable: false })
  title: string;

  @ApiProperty({ example: 'Round trip, economy class' })
  @Column({ type: 'varchar', nullable: false })
  comments: string;

  @ApiProperty({ example: 'https://booking.com/reservation/abc123' })
  @Column({ type: 'varchar', nullable: false })
  link: string;

  @ApiProperty({ example: 3500.00 })
  @Column({ type: 'float', nullable: false })
  price: number;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ name: 'id_request_destination', type: 'uuid' })
  id_request_destination: string;

  @ManyToOne(
    () => RequestsDestination,
    (requestDestination) => requestDestination.reservations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'id_request_destination' })
  requestDestination: RequestsDestination;
}
