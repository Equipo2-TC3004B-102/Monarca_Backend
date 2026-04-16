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