/**
 * FileName: reservations.entity
 * Description: TypeORM entity representing the 'reservations' database table. Defines
 *              all columns and the ManyToOne relationship to the RequestsDestination entity.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: false })
  comments: string;

  @Column({ type: 'varchar', nullable: false })
  link: string;

  
  @Column({ type: 'float', nullable: false })
  price: number;

  @Column({ name: 'id_request_destination', type: 'uuid' })
  id_request_destination: string;

  @ManyToOne(
    () => RequestsDestination,
    (requestDestination) => requestDestination.reservations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'id_request_destination' })
  requestDestination: RequestDestination;
}
