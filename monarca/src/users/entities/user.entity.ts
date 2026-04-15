/**
 * FileName: user.entity.ts
 * Description: TypeORM entity representing the users table. A user belongs to a
 *              CeCo (department), role and optionally a travel agency. Can have many
 *              requests, assigned requests, revisions and SOI assigned requests.
 * Authors: Original Monarca team
 * Last Modification made:
 * 15/04/2026 [Julio Rodríguez] Added company relationship to User entity to associate users with their respective companies.
 */

import { ApiProperty } from '@nestjs/swagger';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { Request } from 'src/requests/entities/request.entity';
import { Revision } from 'src/revisions/entities/revision.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { TravelAgency } from 'src/travel-agencies/entities/travel-agency.entity';
import { Company } from 'src/companies/entity/company.entity';

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'juan@gmail.com' })
  @Column()
  email: string;

  @ApiProperty({ example: 'Juan' })
  @Column()
  name: string;

  @ApiProperty({ example: 'López' })
  @Column()
  last_name: string;

  @ApiProperty({ example: '123456' })
  @Column()
  password: string;

  @ApiProperty({ example: 'active' })
  @Column()
  status: string;

  @ApiProperty({ example: 1 })
  @Column({ name: 'id_department' })
  id_ceco: string;

  @ApiProperty({ example: 2 })
  @Column()
  id_role: string;

  @ApiProperty()
  @Column({
    type: 'uuid',
    nullable: true,
  })
  id_travel_agency?: string;

  // Add company attribute
  @ApiProperty({ example: 1 })
  @Column({
    type: 'uuid',
    nullable: true,
  })
  id_company?: string;  

  // Relationships
  @ManyToOne(() => CostCenter)
  @JoinColumn({ name: 'id_department' })
  ceco: CostCenter;

  @ManyToOne(() => Roles)
  @JoinColumn({ name: 'id_role' })
  role: Roles;

  @ManyToOne(() => TravelAgency, (travel_agency) => travel_agency.users)
  @JoinColumn({ name: 'id_travel_agency' })
  travel_agency?: TravelAgency;

  // TODO: add relationship later
  @OneToMany(() => Revision, (log) => log.request, {})
  revisions: Revision[];

  @OneToMany(() => Request, (req) => req.user, {})
  requests: Request[];

  @OneToMany(() => Request, (req) => req.admin, {})
  assigned_requests: Request[];

  // Modified relationship for consistency with Request entity, One SOI user can have many SOI assigned requests
  @OneToMany(() => Request, (req) => req.SOI, {})
  SOI_assigned_requests: Request[];

  // Added relationship with Company 1 company can have many users
  @ManyToOne(() => Company, (company) => company.employees)
  @JoinColumn({ name: 'id_company' })
  company?: Company;
}
