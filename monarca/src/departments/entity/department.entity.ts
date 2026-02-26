/**
 * FileName: department.entity.ts
 * Description: TypeORM entity representing the departments table. A department
 *              belongs to a cost center and can have many users associated to it.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
@Entity({ name: 'departments' })
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // One department can have many users.
  @OneToMany(() => User, (user) => user.department)
  users: User[];

  @ManyToOne(() => CostCenter, (costCenter) => costCenter.departments)
  @JoinColumn({ name: 'cost_center_id' })
  cost_center: CostCenter;

}