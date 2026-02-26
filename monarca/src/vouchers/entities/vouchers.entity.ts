/**
 * FileName: vouchers.entity
 * Description: TypeORM entity representing the 'vouchers' database table. Defines
 *              all columns and the ManyToOne relationship to the Request entity.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';
@Entity({ name: 'vouchers' })
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_request', type: 'uuid' })
  id_request: string;

  @Column({ name: 'class', type: 'varchar' })
  class: string;

  @Column({ name: 'amount', type: 'float' })
  amount: number;

  @Column({ name: 'taxt_type', type: 'varchar' })
  tax_type: string;

  @Column({ name: 'currency', type: 'varchar' })
  currency: string;

  @Column({ name: 'date', type: 'timestamptz' })
  date: Date;

  @Column({ name: 'file_url_pdf', type: 'varchar',nullable: true })
  file_url_pdf: string | null;

  @Column({ name: 'file_url_xml', type: 'varchar', nullable: true })
  file_url_xml: string | null;

  @Column({ name: 'status', type: 'varchar' })
  status: string;

  @Column({ name: 'id_approver', type: 'uuid' })
  id_approver: string;

  @ManyToOne(
    () => Request,
    (requests) => requests.id,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'id_request' })
  requests: Request;
}
