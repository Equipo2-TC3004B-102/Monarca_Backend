/**
 * FileName: requests-destination.entity.ts
 * Description: Request destination entity. Stores each destination leg associated
 *              with a travel request, including reservation requirements and
 *              provider support metadata for compatibility checks.
 * Authors: Original Monarca team
 * Last Modification made:
 * 23/04/2026 [Julio Rodríguez] Added | null to nullable column types; added onDelete to relations for better data integrity.
 *                            Added uuid type to FK columns for consistency.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';
import { Reservation } from 'src/reservations/entity/reservations.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { Destination } from 'src/destinations/entities/destination.entity';

@Entity({ name: 'requests_destinations' })
export class RequestsDestination {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ name: 'id_destination', type: 'uuid' })
  id_destination: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ name: 'id_request', type: 'uuid' })
  id_request: string;

  @ApiProperty({ example: 1 })
  @Column({ name: 'destination_order', type: 'int' })
  destination_order: number;

  @ApiProperty({ example: 3 })
  @Column({ name: 'stay_days', type: 'int' })
  stay_days: number;

  @ApiProperty({ example: '2026-05-10T10:00:00Z' })
  @Column({ name: 'arrival_date', type: 'timestamp' })
  arrival_date: Date;

  @ApiProperty({ example: '2026-05-13T18:00:00Z' })
  @Column({ name: 'departure_date', type: 'timestamp' })
  departure_date: Date;

  @ApiProperty({ example: true })
  @Column({ name: 'is_hotel_required', default: true })
  is_hotel_required: boolean;

  @ApiProperty({ example: true })
  @Column({ name: 'is_plane_required', default: true })
  is_plane_required: boolean;

  @ApiProperty({ example: false })
  @Column({ name: 'is_last_destination', default: false })
  is_last_destination: boolean;

  @ApiProperty({ example: 'Window seat preferred', required: false, nullable: true })
  @Column({ name: 'details', type: 'varchar', nullable: true })
  details: string | null;

  @ApiProperty({ example: 'pending_provider' })
  @Column({
    name: 'provider_support_status',
    type: 'varchar',
    length: 40,
    default: 'pending_provider',
  })
  provider_support_status: string;

  @ApiProperty({ example: 'Provider does not support this route', required: false, nullable: true })
  @Column({ name: 'provider_support_reason', type: 'text', nullable: true })
  provider_support_reason: string | null;

  @ApiProperty({ example: '2026-04-23T12:00:00Z', required: false, nullable: true })
  @Column({ name: 'provider_support_checked_at', type: 'timestamp', nullable: true })
  provider_support_checked_at: Date | null;

  // Relationships

  // Many request destinations can belong to one request.
  @ManyToOne(() => Request, (request) => request.requests_destinations, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn({ name: 'id_request' })
  request: Request;

  // One request destination can have many reservations (e.g., hotel, flight).
  @OneToMany(() => Reservation, (reservation) => reservation.requestDestination)
  reservations: Reservation[];

  // One request destination can have many vouchers associated with it.
  @ManyToOne(() => Destination, (dest) => dest.requests_destinations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_destination' })
  destination: Destination;
}
