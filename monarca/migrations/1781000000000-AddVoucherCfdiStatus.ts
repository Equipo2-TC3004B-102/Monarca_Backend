/**
 * FileName: 1781000000000-AddVoucherCfdiStatus.ts
 * Description: Adds the cfdi_status column to the vouchers table to track the
 *              SAT validation outcome of the linked CFDI invoice. Possible values
 *              are VALID, CANCELED, NOT_FOUND, and PENDING. The column is nullable
 *              for backwards compatibility with previously persisted vouchers that
 *              were created before the cross-check (issue #69-child) was wired in.
 * Authors: Juan Pablo Narchi
 * Last Modification made:
 * 05/05/2026 [Juan Pablo Narchi] Created migration for cfdi_status column.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVoucherCfdiStatus1781000000000 implements MigrationInterface {
    name = 'AddVoucherCfdiStatus1781000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "vouchers" ADD "cfdi_status" character varying(16)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "vouchers" DROP COLUMN "cfdi_status"`,
        );
    }
}
