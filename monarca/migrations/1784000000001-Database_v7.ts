/**
 * FileName: 1784000000001-Database_v7.ts
 * Description: Multi-level approval + per-company request numbering.
 *              1. Adds approval_count to requests — tracks approvals given at the current level.
 *              2. Adds ceco_id to approval_levels — CECO-scoped rule matching.
 *              3. Creates company_request_counters — atomic per-company request numbering.
 *              4. Converts request_num from global SERIAL to per-company counter.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 03/06/2026 [Julio Rodriguez] Added ceco_id, company_request_counters and per-company request_num.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseV71784000000001 implements MigrationInterface {
  name = 'DatabaseV71784000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE requests ADD COLUMN IF NOT EXISTS approval_count INTEGER NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE approval_levels ADD COLUMN IF NOT EXISTS ceco_id VARCHAR`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS company_request_counters (
        company_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
        counter    INTEGER NOT NULL DEFAULT 0
      )
    `);
    await queryRunner.query(`
      INSERT INTO company_request_counters (company_id, counter)
      SELECT id_company, COUNT(*)::INTEGER FROM requests GROUP BY id_company
      ON CONFLICT (company_id) DO NOTHING
    `);
    await queryRunner.query(
      `ALTER TABLE requests ALTER COLUMN request_num DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_request_num_key`,
    );
    await queryRunner.query(
      `ALTER TABLE requests ADD CONSTRAINT requests_request_num_company_key UNIQUE (id_company, request_num)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_request_num_company_key`,
    );
    await queryRunner.query(
      `ALTER TABLE requests ADD CONSTRAINT requests_request_num_key UNIQUE (request_num)`,
    );
    await queryRunner.query(
      `ALTER TABLE requests ALTER COLUMN request_num SET DEFAULT nextval('requests_request_num_seq')`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS company_request_counters`);
    await queryRunner.query(
      `ALTER TABLE approval_levels DROP COLUMN IF EXISTS ceco_id`,
    );
    await queryRunner.query(
      `ALTER TABLE requests DROP COLUMN IF EXISTS approval_count`,
    );
  }
}
