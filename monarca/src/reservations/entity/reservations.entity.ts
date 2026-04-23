/**
 * FileName: reservations.entity
 * Description: TypeORM entity representing the 'reservations' database table. Defines
 *              all columns and the ManyToOne relationship to the RequestsDestination entity.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 23/04/2026 [Julio Rodríguez] Fixed requestDestination relation type typo.
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
  requestDestination: RequestsDestination;
}
