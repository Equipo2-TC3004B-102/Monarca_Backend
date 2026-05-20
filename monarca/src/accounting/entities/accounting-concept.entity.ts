/**
 * FileName: accounting-concept.entity.ts
 * Description: TypeORM entity for the accounting_concepts table. Maps a voucher
 *              class/concept (e.g. "comida", "hospedaje") to its GL expense account
 *              on a per-company basis. Used when building the Debe lines of a GV poliza.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 20/05/2026 [Julio Rodriguez] Created entity.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Company } from 'src/companies/entity/company.entity';

@Entity({ name: 'accounting_concepts' })
@Unique(['id_company', 'concept'])
export class AccountingConcept {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_company', type: 'uuid' })
  id_company: string;

  @Column({ name: 'concept', type: 'varchar', length: 100 })
  concept: string;

  @Column({ name: 'gl_account', type: 'varchar', length: 10 })
  gl_account: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_company' })
  company: Company;
}
