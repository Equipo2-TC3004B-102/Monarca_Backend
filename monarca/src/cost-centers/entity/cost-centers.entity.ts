/**
 * FileName: cost-centers.entity.ts
 * Description: TypeORM entity representing the cost_centers table. A cost center
 *              belongs to one company.
 * Authors: Original Monarca team
 * Last Modification made:
 * 03/05/2026 [Julio Rodriguez] Changed PK from auto-generated UUID to varchar so company import can use human-readable codes (e.g. "TEC-001").
 */

import { ApiProperty } from '@nestjs/swagger';
import { Company } from 'src/companies/entity/company.entity'; // Added import for Company entity to establish relationship
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm'; // Importing necessary decorators and related entities for defining relationships

@Entity({ name: 'cost_centers' })
export class CostCenter {
  @ApiProperty({ example: 'TEC-001' })
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @ApiProperty({ example: 'Finanzas' })
  @Column({ name: 'name', type: 'varchar', nullable: true })
  name: string | null;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @Column({ type: 'uuid' })
  id_company: string;

  // Relationship with Company entity. Many cost centers can belong to one company.
  @ManyToOne(() => Company, (company) => company.cost_centers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_company' })
  company: Company;
}