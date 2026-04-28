/**
 * FileName: user.entity.ts
 * Description: TypeORM entity representing the users table. A user belongs to a
 *              CeCo (department), role and optionally a travel agency. Can have many
 *              requests, assigned requests, revisions and SOI assigned requests.
 * Authors: Original Monarca team
 * Last Modification made:
 * 23/04/2026 [Julio Rodríguez] Added | null to nullable column types; added onDelete to relations for better data integrity.
 *                              Added company relation and manager self-relation for organizational structure.
 */

import { ApiProperty } from '@nestjs/swagger';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { RequestLog } from 'src/request-logs/entities/request-log.entity';
import { Request } from 'src/requests/entities/request.entity';
import { Revision } from 'src/revisions/entities/revision.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { TravelAgency } from 'src/travel-agencies/entities/travel-agency.entity';
import { UserLogs } from 'src/user-logs/entity/user-logs.entity';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { Company } from 'src/companies/entity/company.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @ApiProperty({ example: 'juan@gmail.com' })
  @Column({ name: 'email' })
  email: string;

  @ApiProperty({ example: 'Juan' })
  @Column({ name: 'name' })
  name: string;

  @ApiProperty({ example: 'López' })
  @Column({ name: 'last_name' })
  last_name: string;

  @ApiProperty({ example: '123456' })
  @Column({ name: 'password' })
  password: string;

  @ApiProperty({ example: 'active' })
  @Column({ name: 'status' })
  status: string;

  @ApiProperty({ example: 'E-1001', required: false })
  @Column({ name: 'employee_num', type: 'varchar', nullable: true })
  employee_num: string | null;

  @ApiProperty({ example: 'jrodriguez' })
  @Column({ name: 'user_name' })
  user_name: string;

  @ApiProperty({ required: false })
  @Column({ name: 'creation_date', type: 'date', default: () => 'CURRENT_DATE' })
  creation_date: Date;

  @ApiProperty({ example: 1 })
  @Column({ name: 'id_ceco', type: 'uuid', nullable: true })
  id_ceco: string | null;

  @ApiProperty({ example: 2 })
  @Column({ name: 'id_role' })
  id_role: string;

  @ApiProperty()
  @Column({
    name: 'id_travel_agency',
    type: 'uuid',
    nullable: true,
  })
  id_travel_agency: string | null;

  // Add company attribute
  @ApiProperty({ example: 1 })
  @Column({ name: 'id_company', type: 'uuid', nullable: true })
  id_company: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'provider', type: 'varchar', nullable: true })
  provider: string | null;

  @ApiProperty({ required: false })
  @Column({ name: 'manager_id', type: 'uuid', nullable: true })
  manager_id: string | null;

  // Flags for permissions and role management.
  @ApiProperty({ required: false })
  @Column({ name: 'is_system_admin', default: false })
  is_system_admin: boolean;

  @ApiProperty({ required: false })
  @Column({ name: 'is_first_login', default: true })
  is_first_login: boolean;

  @ApiProperty({ required: false })
  @Column({ name: 'is_requester', default: true })
  is_requester: boolean;

  @ApiProperty({ required: false })
  @Column({ name: 'is_approver', default: false })
  is_approver: boolean;

  @ApiProperty({ required: false })
  @Column({ name: 'is_soi', default: false })
  is_soi: boolean;

  @ApiProperty({ required: false })
  @Column({ name: 'is_travelAgent', default: false })
  is_travelAgent: boolean;

  // Added flag to indicate if the user is a company admin.
  @ApiProperty({ required: false })
  @Column({ name: 'is_company_admin', default: false })
  is_company_admin: boolean;

  @ApiProperty({ required: false })
  @Column({ name: 'first_login_at', type: 'timestamp', nullable: true })
  first_login_at: Date | null;

  @ApiProperty({ required: false })
  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  last_login_at: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;

  // Relationships

  // Many users can belong to one cost center (CeCo).
  @ManyToOne(() => CostCenter, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_ceco' })
  ceco: CostCenter | null;

  // Pending to move logic to flags
  @ManyToOne(() => Roles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'id_role' })
  role: Roles;

  // Pending to review
  @ManyToOne(() => TravelAgency, (travel_agency) => travel_agency.users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_travel_agency' })
  travel_agency: TravelAgency | null;

  // One user can have many revisions
  @OneToMany(() => Revision, (revision) => revision.user, {})
  revisions: Revision[];

  // One user can have many request logs
  @OneToMany(() => RequestLog, (requestLog) => requestLog.user, {})
  request_logs: RequestLog[];

  // One user can have many user logs
  @OneToMany(() => UserLogs, (userLog) => userLog.user, {})
  user_logs: UserLogs[];

  // One user can approve many vouchers
  @OneToMany(() => Voucher, (voucher) => voucher.approver, {})
  approved_vouchers: Voucher[];

  // One user can have many requests
  @OneToMany(() => Request, (req) => req.user, {})
  requests: Request[];

  // One admin user can have many assigned requests
  @OneToMany(() => Request, (req) => req.admin, {})
  assigned_requests: Request[];

  // Modified relationship for consistency with Request entity, One SOI user can have many SOI assigned requests
  @OneToMany(() => Request, (req) => req.SOI, {})
  SOI_assigned_requests: Request[];

  // Added relationship with Company 1 company can have many users
  @ManyToOne(() => Company, (company) => company.employees, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'id_company' })
  company: Company | null;

  // Added self-referential relationship for manager and direct reports, One manager can have many direct reports, and one user can have one manager
  @ManyToOne(() => User, (manager) => manager.direct_reports, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  // For the inverse side of the manager relationship, One user can have many direct reports
  @OneToMany(() => User, (user) => user.manager)
  direct_reports: User[];
}
