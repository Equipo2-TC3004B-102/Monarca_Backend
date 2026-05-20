/**
 * FileName: voucher-creation-log.entity.ts
 * Description: TypeORM entity representing the voucher_creation_logs table.
 *              Records every voucher creation attempt, successful or not,
 *              for auditing and debugging purposes.
 * Authors: S0Borjas
 * Last Modification made:
 * 27/04/2026 [S0Borjas] Created entity for voucher creation audit logging.
 */

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'voucher_creation_logs' })
export class VoucherCreationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_request', type: 'uuid', nullable: true })
  id_request: string | null;

  @Column({ name: 'id_user', type: 'uuid' })
  id_user: string;

  @Column({ name: 'outcome', type: 'varchar', length: 10 })
  outcome: 'success' | 'failure';

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failure_reason: string | null;

  @Column({ name: 'attempted_voucher_date', type: 'varchar', length: 64, nullable: true })
  attempted_voucher_date: string | null;

  @Column({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;
}
