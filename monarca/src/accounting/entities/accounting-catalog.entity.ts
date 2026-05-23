/**
 * FileName: accounting-catalog.entity.ts
 * Description: TypeORM entity for the accounting_catalogs table. Stores the three
 *              fixed GL accounts required for every poliza type: the advance account
 *              (gl_advance), the employee accounts-payable account (gl_cxp), and the
 *              recoverable IVA account (gl_iva). One catalog per company.
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
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from 'src/companies/entity/company.entity';

@Entity({ name: 'accounting_catalogs' })
export class AccountingCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_company', type: 'uuid', unique: true })
  id_company: string;

  @Column({ name: 'gl_advance', type: 'varchar', length: 10, default: '' })
  gl_advance: string;

  @Column({ name: 'gl_cxp', type: 'varchar', length: 10, default: '' })
  gl_cxp: string;

  @Column({ name: 'gl_iva', type: 'varchar', length: 10, default: '' })
  gl_iva: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updated_at: Date;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_company' })
  company: Company;
}
