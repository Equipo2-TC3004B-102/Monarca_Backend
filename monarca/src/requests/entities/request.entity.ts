/**
 * FileName: request.entity.ts
 * Description: TypeORM entity representing the requests table. A request
 *              can have many destinations associated to it.
 * Authors: Original Monarca team
 * Last Modification made:
 * 23/04/2026 [Jin Sik Yoon] - Added id_company column and established relationship with Company entity.
 */

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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_user', type: 'uuid' })
  id_user: string;

  @Column()
  id_origin_city: string;

  @Column()
  id_admin: string;

  @Column()
  id_SOI: string;

  @Column({ nullable: true, default: null })
  id_travel_agency: string;

  // New column to establish relationship with Company entity.
  @Column({ type: 'uuid' })
  id_company: string;

  @Column()
  title: string;

  @Column()
  motive: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  advance_money: number;

  @Column({ type: 'varchar', nullable: true })
  currency: string | null;

  @Column({ type: 'float', nullable: true })
  exchange_rate: number | null;

  @Column({ type: 'decimal', nullable: true })
  unconverted_advance_money: number | null;

  @Column({ default: 'Pending Review' })
  status: string;

  @Column({ nullable: true })
  requirements?: string;

  @Column()
  priority: string;

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
