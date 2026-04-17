/**
 * FileName: Database.ts
 * Description: TypeORM migration to add iata_code and airport_name columns to the destinations table.
 *              This supports the import of detailed airport data from a CSV file, 
 *              including converting ISO country codes to country names for better readability.
 * Authors: Jin Sik Yoon
 * Last Modification made:
 * 16/04/2026 [Jin Sik Yoon] Added migration to support new airport-related fields for multidestination support and CSV migration.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseV21776299689378 implements MigrationInterface {
  name = 'DatabaseV21776299689378';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "destinations" ADD "iata_code" character varying(10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "destinations" ADD "airport_name" character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "destinations" DROP COLUMN "airport_name"`,
    );
    await queryRunner.query(
      `ALTER TABLE "destinations" DROP COLUMN "iata_code"`,
    );
  }
}
