/**
 * FileName: Database_v2.ts
 * Description: TypeORM migration to add currency-related fields to the requests table.
 *              This supports request currency handling and exchange rate tracking.
 * Authors: Jin Sik Yoon
 * Last Modification made:
 * 16/04/2026 [Jin Sik Yoon] Added currency, exchange_rate, and unconverted_advance_money columns to requests.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseV21776307000000 implements MigrationInterface {
  name = 'DatabaseV21776307000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "currency" character varying
    `);

    await queryRunner.query(`
      ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "exchange_rate" numeric
    `);

    await queryRunner.query(`
      ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "unconverted_advance_money" numeric
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "requests" DROP COLUMN IF EXISTS "unconverted_advance_money"
    `);

    await queryRunner.query(`
      ALTER TABLE "requests" DROP COLUMN IF EXISTS "exchange_rate"
    `);

    await queryRunner.query(`
      ALTER TABLE "requests" DROP COLUMN IF EXISTS "currency"
    `);
  }
}