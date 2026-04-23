/**
 * FileName: request.entity.ts
 * Description: TypeORM entity representing the requests table. A request
 *              can have many destinations associated to it.
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
  OneToMany,
  ManyToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { RequestLog } from 'src/request-logs/entities/request-log.entity';
import { Revision } from 'src/revisions/entities/revision.entity';
import { Destination } from 'src/destinations/entities/destination.entity';
import { User } from 'src/users/entities/user.entity';
import { TravelAgency } from 'src/travel-agencies/entities/travel-agency.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { Company } from 'src/companies/entity/company.entity'; // Added import for Company entity to establish relationship

@Entity({ name: 'requests' })
export class Request {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ name: 'id_user', type: 'uuid' })
  id_user: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ type: 'uuid' })
  id_origin_city: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ type: 'uuid' })
  id_admin: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ type: 'uuid' })
  id_SOI: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false, nullable: true })
  @Column({ nullable: true, default: null, type: 'uuid' })
  id_travel_agency: string | null;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ type: 'uuid' })
  id_company: string;

  @ApiProperty({ example: 'Business trip to Monterrey' })
  @Column()
  title: string;

  @ApiProperty({ example: 'Client meeting for Q2 review' })
  @Column()
  motive: string;

  @ApiProperty({ example: 5000 })
  @Column()
  advance_money: number;

  @ApiProperty({ example: 'MXN', required: false, nullable: true })
  @Column({ type: 'varchar', nullable: true })
  currency: string | null;

  @ApiProperty({ example: 17.5, required: false, nullable: true })
  @Column({ type: 'float', nullable: true })
  exchange_rate: number | null;

  @ApiProperty({ example: 5000, required: false, nullable: true })
  @Column({ type: 'integer', nullable: true })
  unconverted_advance_money: number | null;

  @ApiProperty({ example: 'Pending Review' })
  @Column({ default: 'Pending Review' })
  status: string;

  @ApiProperty({ example: 'Laptop required', required: false, nullable: true })
  @Column({ nullable: true })
  requirements?: string;

  @ApiProperty({ example: 'High' })
  @Column()
  priority: string;

  @ApiProperty({ example: '2026-04-23T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships

  @OneToMany(() => RequestsDestination, (dest) => dest.request, {
    cascade: true,
  })
  requests_destinations: RequestsDestination[];

  @OneToMany(() => RequestLog, (log) => log.request, {})
  requestLogs: RequestLog[];

  @OneToMany(() => Revision, (rev) => rev.request, {})
  revisions: Revision[];

  @ManyToOne(() => Destination, (dest) => dest.requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_origin_city' })
  destination: Destination;

  @ManyToOne(() => User, (usr) => usr.requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_user' })
  user: User;

  @ManyToOne(() => User, (usr) => usr.assigned_requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_admin' })
  admin: User;

  @ManyToOne(() => User, (usr) => usr.SOI_assigned_requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_SOI' })
  SOI: User;

  @ManyToOne(() => TravelAgency, (trva) => trva.requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_travel_agency' })
  travel_agency: TravelAgency;

  // New relationship with Company entity, Many requests can belong to one company
  @ManyToOne(() => Company, (company) => company.requests)
  @JoinColumn({ name: 'id_company' })
  company: Company;

  // Updated inverse relation mapping for vouchers, One request can have many vouchers
  @OneToMany(() => Voucher, (voucher) => voucher.request, {})
  vouchers: Voucher[];
}
