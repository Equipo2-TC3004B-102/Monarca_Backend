/**
 * FileName: vouchers.entity
 * Description: TypeORM entity representing the 'vouchers' database table. Defines
 *              all columns, fiscal fields for CFDI integration,
 *              and the ManyToOne relationship to the Request entity.
 * Authors: Original Monarca team
 * Last Modification made:
 * 16/04/2026 [Fausto Izquierdo] Fixed taxt_type typo, changed amount to decimal,
 *            added receiver_name and exchange_rate.
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

  @Column({ name: 'amount', type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ name: 'tax_type', type: 'varchar' })
  tax_type: string;

  @Column({ name: 'currency', type: 'varchar' })
  currency: string;

  @Column({ name: 'date', type: 'timestamptz' })
  date: Date;

  @Column({ name: 'file_url_pdf', type: 'varchar', nullable: true })
  file_url_pdf: string | null;

  @Column({ name: 'file_url_xml', type: 'varchar', nullable: true })
  file_url_xml: string | null;

  @Column({ name: 'status', type: 'varchar' })
  status: string;

  @Column({ name: 'id_approver', type: 'uuid' })
  id_approver: string;

  // ──────────────────────────────────────────────
  // Fiscal fields – CFDI integration
  // ──────────────────────────────────────────────

  /** UUID del Timbre Fiscal Digital (36 chars, unique per invoice) */
  @Column({ name: 'fiscal_uuid', type: 'varchar', length: 36, unique: true, nullable: true })
  fiscal_uuid: string | null;

  /** RFC del emisor de la factura */
  @Column({ name: 'issuer_rfc', type: 'varchar', nullable: true })
  issuer_rfc: string | null;

  /** Razón social del emisor */
  @Column({ name: 'issuer_name', type: 'varchar', nullable: true })
  issuer_name: string | null;

  /** RFC del receptor de la factura */
  @Column({ name: 'receiver_rfc', type: 'varchar', nullable: true })
  receiver_rfc: string | null;

  /** Razón social del receptor (e.g. Ditta's legal name) */
  @Column({ name: 'receiver_name', type: 'varchar', nullable: true })
  receiver_name: string | null;

  /** Subtotal antes de impuestos */
  @Column({ name: 'subtotal', type: 'decimal', precision: 12, scale: 2, nullable: true })
  subtotal: number | null;

  /** Total de impuestos trasladados (IVA, IEPS) */
  @Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  tax_amount: number | null;

  /** Total de impuestos retenidos (ISR, IVA retenido) */
  @Column({ name: 'retention_amount', type: 'decimal', precision: 12, scale: 2, nullable: true })
  retention_amount: number | null;

  /** Tipo de Cambio – exchange rate at the time of the transaction */
  @Column({ name: 'exchange_rate', type: 'decimal', precision: 12, scale: 4, nullable: true })
  exchange_rate: number | null;

  // ──────────────────────────────────────────────
  // Relationships
  // ──────────────────────────────────────────────

  @ManyToOne(
    () => Request,
    (requests) => requests.id,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'id_request' })
  requests: Request;
}

