/**
 * FileName: 1776836287757-FixDecisionTypoInRequestApprovals.ts
 * Description: Renames the misspelled column "descision" to "decision"
 *              in the request_approvals table.
 * Authors: DebugStudio Team
 * Last Modification: 21/04/2026 [Julio Rodríguez] Created migration to fix typo in request_approvals
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixDecisionTypoInRequestApprovals1776836287757
  implements MigrationInterface
{
  name = 'FixDecisionTypoInRequestApprovals1776836287757';

  /**
   * up - Renames "descision" column to "decision" in request_approvals.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "request_approvals" RENAME COLUMN "descision" TO "decision"`,
    );
  }

  /**
   * down - Reverts "decision" column back to "descision" in request_approvals.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "request_approvals" RENAME COLUMN "decision" TO "descision"`,
    );
  }
}
