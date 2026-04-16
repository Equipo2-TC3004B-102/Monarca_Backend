/**
 * FileName: destination.entity.ts
 * Description: TypeORM entity representing the destinations table. A destination
 *              stores airport and location information used for travel requests.
 * Authors: Original Monarca team
 * Last Modification made:
 * 15/04/2026 [Jin Sik Yoon] Added airport-related fields for multidestination support and CSV migration.
 */

import { Request } from 'src/requests/entities/request.entity';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'destinations' })
export class Destination {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  country: string;

  @Column()
  city: string;

  @Column({ nullable: true, length: 10 })
  iata_code: string;

  @Column({ nullable: true, length: 255 })
  airport_name: string;

  @OneToMany(() => Request, (req) => req.destination, {
    cascade: true,
  })
  requests: Request[];

  @OneToMany(() => RequestsDestination, (reqdest) => reqdest.destination, {
    cascade: true,
  })
  requests_destinations: RequestsDestination[];
}