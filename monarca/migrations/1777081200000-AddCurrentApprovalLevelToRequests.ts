/**
 * FileName: 1777081200000-AddCurrentApprovalLevelToRequests.ts
 * Description: Adds current_approval_level_id nullable FK to the requests table.
 *              Allows the approval engine to track which approval level a request
 *              is currently at. SET NULL on approval level deletion so the request
 *              is not lost if a level is removed.
 * Authors: DebugStudio Team
 * Last Modification: 22/04/2026 [Julio Rodríguez] Created migration for Gap B resolution.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCurrentApprovalLevelToRequests1777081200000
  implements MigrationInterface
{
  name = 'AddCurrentApprovalLevelToRequests1777081200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requests" ADD "current_approval_level_id" uuid NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" ADD CONSTRAINT "FK_requests_current_approval_level"
       FOREIGN KEY ("current_approval_level_id")
       REFERENCES "approval_levels"("id")
       ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requests" DROP CONSTRAINT "FK_requests_current_approval_level"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests" DROP COLUMN "current_approval_level_id"`,
    );
  }
}
