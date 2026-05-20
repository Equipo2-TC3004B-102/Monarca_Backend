/**
 * FileName: request.entity.ts
 * Description: TypeORM entity representing the requests table. A request
 *              can have many destinations associated to it.
 * Authors: Original Monarca team
 * Last Modification made:
 * 23/04/2026 [Julio Rodríguez] Added | null to nullable column types; added onDelete to relations for better data integrity.
 *                            Added uuid type to FK columns for consistency.
 *                            Added current_approval_level_id nullable FK to track active approval level.
 * 19/05/2026 [Julio Rodriguez] Added request_num SERIAL column for human-readable folio (YYYY-NNN).
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
import { ApprovalLevel } from 'src/approval-engine/entities/approval-level.entity';
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

  @ApiProperty({ example: 42 })
  @Column({ type: 'integer', unique: true, insert: false, update: false })
  request_num: number;

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

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  advance_money: number;

  @ApiProperty({ example: 'MXN', required: false, nullable: true })
  @Column({ type: 'varchar', nullable: true })
  currency: string | null;

  @ApiProperty({ example: 17.5, required: false, nullable: true })
  @Column({ type: 'float', nullable: true })
  exchange_rate: number | null;

  @Column({ type: 'decimal', nullable: true })
  unconverted_advance_money: number | null;

  @ApiProperty({ example: 'Pending Review' })
  @Column({ default: 'Pending Review' })
  status: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', required: false, nullable: true })
  @Column({ name: 'current_approval_level_id', type: 'uuid', nullable: true, default: null })
  current_approval_level_id: string | null;

  @ApiProperty({ example: 'Laptop required', required: false, nullable: true })
  @Column({ name: 'requirements', type: 'varchar', nullable: true })
  requirements: string | null;

  @ApiProperty({ example: 'High' })
  @Column()
  priority: string;

  @ApiProperty({ example: '2026-04-23T12:00:00Z' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships

  // One request can have many destinations, and if a request is deleted, its associated destinations will also be deleted (cascade).
  @OneToMany(() => RequestsDestination, (dest) => dest.request, {
    cascade: true,
  })
  requests_destinations: RequestsDestination[];

  // One request can have many logs, and if a request is deleted, its associated logs will also be deleted.
  @OneToMany(() => RequestLog, (log) => log.request, {
    cascade: true,
  })
  requestLogs: RequestLog[];

  // One request can have many revisions, and if a request is deleted, its associated revisions will also be deleted.
  @OneToMany(() => Revision, (rev) => rev.request, {
    cascade: true,
  })
  revisions: Revision[];

  // Many requests can belong to one destination (origin city).
  @ManyToOne(() => Destination, (dest) => dest.requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_origin_city' })
  destination: Destination;

  // Many requests can belong to one user.
  @ManyToOne(() => User, (usr) => usr.requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_user' })
  user: User;

  // Many requests can be assigned to one admin, and if an admin is deleted, its associated requests will also be deleted.
  @ManyToOne(() => User, (usr) => usr.assigned_requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_admin' })
  admin: User;

  // Many requests can be assigned to one SOI, and if a SOI is deleted, its associated requests will also be deleted.
  @ManyToOne(() => User, (usr) => usr.SOI_assigned_requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_SOI' })
  SOI: User;

  // Many requests can belong to one travel agency, and if a travel agency is deleted, its associated requests will also be deleted. Pending to review.
  @ManyToOne(() => TravelAgency, (trva) => trva.requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_travel_agency' })
  travel_agency: TravelAgency;

  // New relationship with Company entity, Many requests can belong to one company
  @ManyToOne(() => Company, (company) => company.requests)
  @JoinColumn({ name: 'id_company' })
  company: Company;

  // New relationship with ApprovalLevel entity to track the current approval level of the request. This is a ManyToOne relationship since many requests can be at the same approval level.
  @ManyToOne(() => ApprovalLevel, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'current_approval_level_id' })
  current_approval_level: ApprovalLevel | null;

  // Updated inverse relation mapping for vouchers, One request can have many vouchers
  @OneToMany(() => Voucher, (voucher) => voucher.request, {})
  vouchers: Voucher[];
}
