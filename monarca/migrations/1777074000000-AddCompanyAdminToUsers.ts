/**
 * FileName: 1777074000000-AddCompanyAdminToUsers.ts
 * Description: Adds the is_company_admin boolean column to the users table.
 *              Supports the company admin authorization flag introduced in the approval engine.
 * Authors: DebugStudio Team
 * Last Modification: 22/04/2026 [Julio Rodríguez] Created migration to add is_company_admin flag.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyAdminToUsers1777074000000 implements MigrationInterface {
  name = 'AddCompanyAdminToUsers1777074000000';

  /**
   * up - Adds is_company_admin column to users table with default false.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_company_admin" boolean NOT NULL DEFAULT false`,
    );
  }

  /**
   * down - Removes is_company_admin column from users table.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "is_company_admin"`,
    );
  }
}
