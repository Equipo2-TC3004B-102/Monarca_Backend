/**
 * FileName: cost-centers.entity.ts
 * Description: TypeORM entity representing the cost_centers table. A cost center
 *              belongs to one company.
 * Authors: Original Monarca team
 * Last Modification made:
 * 15/04/2026 [Julio Rodríguez] Updated the CostCenter entity to represent cost center data and its relationships with companies.
 */

import { Company } from 'src/companies/entity/company.entity'; // Added import for Company entity to establish relationship
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'; // Importing necessary decorators and related entities for defining relationships

@Entity({ name: 'cost_centers' })
export class CostCenter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'uuid' })
  id_company: string;

  @ManyToOne(() => Company, (company) => company.cost_centers)
  @JoinColumn({ name: 'id_company' })
  company: Company;
}