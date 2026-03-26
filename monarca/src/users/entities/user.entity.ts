/**
 * FileName: user.entity.ts
 * Description: TypeORM entity representing the users table. A user belongs to a
 *              department, role and optionally a travel agency. Can have many
 *              requests, assigned requests, revisions and SOI assigned requests.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { ApiProperty } from '@nestjs/swagger';
import { Department } from 'src/departments/entity/department.entity';
import { Request } from 'src/requests/entities/request.entity';
import { Revision } from 'src/revisions/entities/revision.entity';
import { Roles } from 'src/roles/entity/roles.entity';
import { TravelAgency } from 'src/travel-agencies/entities/travel-agency.entity';

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
  @Column()
  id_department: string;

  @ApiProperty({ example: 2 })
  @Column()
  id_role: string;

  @ApiProperty()
  @Column({
    type: 'uuid',
    nullable: true,
  })
  id_travel_agency?: string;

  @ManyToOne(() => Department, (department) => department.users)
  @JoinColumn({ name: 'id_department' })
  department: Department;

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

  @OneToMany(() => Request, (req) => req.admin, {})
  SOI_assigned_requests: Request[];
}
