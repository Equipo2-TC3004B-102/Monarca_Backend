/**
 * FileName: 1781000000003-AddVoucherCfdiStatus.ts
 * Description: Database migration to add a new column 'cfdi_status' to the 'vouchers' table. This column will store the CFDI status of the voucher, allowing for better tracking and management of voucher states in relation to their CFDI processing.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 17/05/2026 [Santiago Coronado Hernández] Created migration to add cfdi_status column to vouchers table for improved CFDI tracking and management.
 */

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddVoucherCfdiStatus1781000000003 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'vouchers',
      new TableColumn({
        name: 'cfdi_status',
        type: 'varchar',
        length: '16',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('vouchers', 'cfdi_status');
  }
}
