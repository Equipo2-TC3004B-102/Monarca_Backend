/**
 * FileName: 1782000000001-Database_v5.ts
 * Description: Two schema additions:
 *              1. Adds a request_num SERIAL column to the requests table to provide
 *                 a short, human-readable identifier for each request. The value is
 *                 formatted as YYYY-NNN in the application layer for use in emails and UI.
 *              2. Adds a voucher_deadline_days INT column to the companies table to
 *                 allow each company to configure how many days after a trip ends
 *                 a user has to submit expense vouchers. Defaults to 7 days.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 19/05/2026 [Julio Rodriguez] Created migration.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseV51782000000001 implements MigrationInterface {
  name = 'DatabaseV51782000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE requests ADD COLUMN request_num SERIAL UNIQUE`,
    );
    await queryRunner.query(
      `ALTER TABLE companies ADD COLUMN voucher_deadline_days INT NOT NULL DEFAULT 7`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE companies DROP COLUMN voucher_deadline_days`,
    );
    await queryRunner.query(
      `ALTER TABLE requests DROP COLUMN request_num`,
    );
  }
}
