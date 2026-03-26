/**
 * FileName: cost-centers.entity.ts
 * Description: TypeORM entity representing the cost_centers table. A cost center
 *              can have many departments associated to it.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan ] Added detailed comments and documentation for clarity and maintainability.
 */

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Department } from 'src/departments/entity/department.entity';

@Entity({ name: 'cost_centers' })
export class CostCenter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // One cost center can have many departments
  @OneToMany(() => Department, (department) => department.cost_center)
  departments: Department[];
}