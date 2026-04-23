/**
 * FileName: destination.entity.ts
 * Description: TypeORM entity representing the destinations table. A destination
 *              stores airport and location information used for travel requests.
 * Authors: Original Monarca team
 * Last Modification made:
 * 23/04/2026 [Julio Rodríguez] Added | null to nullable column types.
 *                              Added explicit data types to columns for better type safety and consistency.
 */

import { Request } from 'src/requests/entities/request.entity';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'destinations' })
export class Destination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'country', type: 'varchar' })
  country: string;

  @Column({ name: 'city', type: 'varchar' })
  city: string;

  @Column({ name: 'iata_code', type: 'varchar', nullable: true, length: 10 })
  iata_code: string | null;

  @Column({ name: 'airport_name', type: 'varchar', nullable: true, length: 255 })
  airport_name: string | null;

  @OneToMany(() => Request, (req) => req.destination, {
    cascade: true,
  })
  requests: Request[];

  @OneToMany(() => RequestsDestination, (reqdest) => reqdest.destination, {
    cascade: true,
  })
  requests_destinations: RequestsDestination[];
}