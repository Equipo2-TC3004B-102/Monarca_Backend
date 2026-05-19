/**
 * FileName: 1777334400000-AddVoucherCreationLogsTable.ts
 * Description: Creates the voucher_creation_logs table for auditing every
 *              voucher creation attempt, including failures and the reason.
 * Authors: S0Borjas
 * Last Modification made:
 * 27/04/2026 [S0Borjas] Initial migration.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVoucherCreationLogsTable1777334400000 implements MigrationInterface {
  name = 'AddVoucherCreationLogsTable1777334400000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "voucher_creation_logs" (
        "id"                     UUID NOT NULL DEFAULT uuid_generate_v4(),
        "id_request"             UUID,
        "id_user"                UUID NOT NULL,
        "outcome"                VARCHAR(10) NOT NULL,
        "failure_reason"         TEXT,
        "attempted_voucher_date" VARCHAR(64),
        "created_at"             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_voucher_creation_logs" PRIMARY KEY ("id")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "voucher_creation_logs"`);
  }
}
