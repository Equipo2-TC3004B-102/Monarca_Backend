/**
 * FileName: cost-centers.entity.ts
 * Description: TypeORM entity representing the cost_centers table. A cost center
 *              belongs to one company.
 * Authors: Original Monarca team
 * Last Modification made:
 * 23/04/2026 [Julio Rodríguez] Added explicit type to name column and onDelete to company relation.
 */

import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Finanzas' })
  @Column({ name: 'name', type: 'varchar' })
  name: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ type: 'uuid' })
  id_company: string;

  // Relationship with Company entity. Many cost centers can belong to one company.
  @ManyToOne(() => Company, (company) => company.cost_centers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_company' })
  company: Company;
}