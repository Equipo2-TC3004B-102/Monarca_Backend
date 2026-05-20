/**
 * FileName: 1781000000001-AddReservationProviderFields.ts
 * Description: Adds provider_id and provider_name columns to the reservations table
 *              to track which flight provider (e.g., Duffel) was used for each reservation.
 *              These fields are nullable to support non-flight reservations.
 * Authors: Diego de la Vega
 * Last Modification made:
 * 13/05/2026 [Diego de la Vega] Created migration to track flight provider attribution.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddReservationProviderFields1781000000001 implements MigrationInterface {
  name = 'AddReservationProviderFields1781000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add provider_id column (nullable for non-flight reservations)
    await queryRunner.query(
      `ALTER TABLE "reservations" ADD COLUMN "provider_id" character varying`,
    );

    // Add provider_name column (nullable for non-flight reservations)
    await queryRunner.query(
      `ALTER TABLE "reservations" ADD COLUMN "provider_name" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop provider_name column
    await queryRunner.query(
      `ALTER TABLE "reservations" DROP COLUMN "provider_name"`,
    );

    // Drop provider_id column
    await queryRunner.query(
      `ALTER TABLE "reservations" DROP COLUMN "provider_id"`,
    );
  }
}
