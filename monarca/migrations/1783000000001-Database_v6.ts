/**
 * FileName: 1783000000001-Database_v6.ts
 * Description: Three schema additions for the accounting poliza export feature:
 *              1. Adds comp_code VARCHAR(10) to companies — SAP company code used as
 *                 COMP_CODE in poliza headers.
 *              2. Creates accounting_catalogs table — one record per company holding
 *                 the three fixed GL accounts needed for every poliza type:
 *                 gl_advance (Anticipo EMPLEADO), gl_cxp (Cuenta x Pagar Empleado),
 *                 gl_iva (IVA Acreditable).
 *              3. Creates accounting_concepts table — maps a voucher class/concept
 *                 to its GL expense account on a per-company basis.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 20/05/2026 [Julio Rodriguez] Created migration.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseV61783000000001 implements MigrationInterface {
  name = 'DatabaseV61783000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE companies ADD COLUMN comp_code VARCHAR(10)`,
    );

    await queryRunner.query(`
      CREATE TABLE accounting_catalogs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_company UUID UNIQUE NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        gl_advance VARCHAR(10) NOT NULL DEFAULT '',
        gl_cxp VARCHAR(10) NOT NULL DEFAULT '',
        gl_iva VARCHAR(10) NOT NULL DEFAULT '',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE TABLE accounting_concepts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_company UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        concept VARCHAR(100) NOT NULL,
        gl_account VARCHAR(10) NOT NULL,
        UNIQUE(id_company, concept)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE accounting_concepts`);
    await queryRunner.query(`DROP TABLE accounting_catalogs`);
    await queryRunner.query(`ALTER TABLE companies DROP COLUMN comp_code`);
  }
}
