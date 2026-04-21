/**
 * FileName: 1777066800000-AddProviderSupportStatusToRequestsDestinations.ts
 * Description: Adds provider support tracking columns to requests_destinations
 *              to represent pending/supported/unsupported compatibility state.
 * Authors: Diego de la Vega
 * Last Modification made:
 * 20/04/2026 [Diego de la Vega] Created migration to add provider support status,
 *                             reason, and checked timestamp columns.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProviderSupportStatusToRequestsDestinations1777066800000
  implements MigrationInterface
{
  name = 'AddProviderSupportStatusToRequestsDestinations1777066800000';

  /**
   * up - Adds provider support metadata columns to requests_destinations.
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requests_destinations" ADD "provider_support_status" character varying(40) NOT NULL DEFAULT 'pending_provider'`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests_destinations" ADD "provider_support_reason" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests_destinations" ADD "provider_support_checked_at" TIMESTAMP`,
    );
  }

  /**
   * down - Reverts provider support metadata columns from requests_destinations.
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requests_destinations" DROP COLUMN "provider_support_checked_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests_destinations" DROP COLUMN "provider_support_reason"`,
    );
    await queryRunner.query(
      `ALTER TABLE "requests_destinations" DROP COLUMN "provider_support_status"`,
    );
  }
}
