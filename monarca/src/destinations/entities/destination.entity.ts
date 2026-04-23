/**
 * FileName: destination.entity.ts
 * Description: TypeORM entity representing the destinations table. A destination
 *              stores airport and location information used for travel requests.
 * Authors: Original Monarca team
 * Last Modification made:
 * 23/04/2026 [Julio Rodríguez] Added | null to nullable column types.
 *                              Added explicit data types to columns for better type safety and consistency.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Request } from 'src/requests/entities/request.entity';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

@Entity({ name: 'destinations' })
export class Destination {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Mexico' })
  @Column({ name: 'country', type: 'varchar' })
  country: string;

  @ApiProperty({ example: 'Monterrey' })
  @Column({ name: 'city', type: 'varchar' })
  city: string;

  @ApiProperty({ example: 'MTY', required: false, nullable: true })
  @Column({ name: 'iata_code', type: 'varchar', nullable: true, length: 10 })
  iata_code: string | null;

  @ApiProperty({ example: 'Aeropuerto Internacional General Mariano Escobedo', required: false, nullable: true })
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