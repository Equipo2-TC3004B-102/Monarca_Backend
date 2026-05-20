/**
 * FileName: 1777153200000-AddDateCreatedToVouchers.ts
 * Description: Adds date_created column to vouchers table to track when
 *              each voucher record was created.
 * Authors: S0Borjas
 * Last Modification made:
 * 27/04/2026 [S0Borjas] Created migration to add date_created timestamp column.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDateCreatedToVouchers1777153200000
  implements MigrationInterface
{
  name = 'AddDateCreatedToVouchers1777153200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vouchers" ADD "date_created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vouchers" DROP COLUMN "date_created"`,
    );
  }
}
