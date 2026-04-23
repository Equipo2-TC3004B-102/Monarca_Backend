/**
 * FileName: cost-centers.entity.ts
 * Description: TypeORM entity representing the cost_centers table. A cost center
 *              belongs to one company.
 * Authors: Original Monarca team
 * Last Modification made:
 * 23/04/2026 [Julio Rodríguez] Added explicit type to name column and onDelete to company relation.
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

  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @Column({ type: 'uuid' })
  id_company: string;

  // Relationship with Company entity. Many cost centers can belong to one company.
  @ManyToOne(() => Company, (company) => company.cost_centers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_company' })
  company: Company;
}