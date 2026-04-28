/**
 * FileName: 1776988508043-Database_v2.ts
 * Description: Consolidates all post-v1 schema changes into a single migration:
 *              - Fixes "descision" typo in request_approvals
 *              - Adds provider support tracking columns to requests_destinations
 *              - Adds is_company_admin flag to users
 *              - Replaces deprecated tax_amount/retention_amount with CFDI fiscal
 *                fields on vouchers (receiver_name, exchange_rate, discount,
 *                iva_trasladado, ieps_trasladado, isr_retenido, iva_retenido,
 *                payment_form, payment_method)
 *              - Consolidates FK onDelete rules for users and cost_centers
 *              - Adds current_approval_level_id nullable FK to requests
 * Authors: DebugStudio Team
 * Last Modification made:
 * 23/04/2026 [Julio Rodríguez] Consolidated from 5 individual migrations into Database_v2.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseV21776988508043 implements MigrationInterface {
    name = 'DatabaseV21776988508043';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Fix decision typo in request_approvals
        await queryRunner.query(`ALTER TABLE "request_approvals" RENAME COLUMN "descision" TO "decision"`);

        // 2. Provider support columns on requests_destinations
        await queryRunner.query(`ALTER TABLE "requests_destinations" ADD "provider_support_status" character varying(40) NOT NULL DEFAULT 'pending_provider'`);
        await queryRunner.query(`ALTER TABLE "requests_destinations" ADD "provider_support_reason" text`);
        await queryRunner.query(`ALTER TABLE "requests_destinations" ADD "provider_support_checked_at" TIMESTAMP`);

        // 3. Company admin flag on users
        await queryRunner.query(`ALTER TABLE "users" ADD "is_company_admin" boolean NOT NULL DEFAULT false`);

        // 4. FK consolidation — drop old constraints
        await queryRunner.query(`ALTER TABLE "cost_centers" DROP CONSTRAINT "FK_7c6525c0a074f5e88385c3ba485"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_b9e12c28cda5eb73ffbab4a663a"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_0ab7be063b1e03d4125c7d47067"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f8a3754f51a266a160e71d261f8"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_9bc572eee16b92a17ee67773388"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_507d63eb2d694cea010feac80e9"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_5525d5fe12604a2d0994d35cbd2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5525d5fe12604a2d0994d35cbd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_507d63eb2d694cea010feac80e"`);

        // 4. CFDI fiscal fields on vouchers
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "tax_amount"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "retention_amount"`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "receiver_name" character varying`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "exchange_rate" numeric(12,4)`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "discount" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "iva_trasladado" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "ieps_trasladado" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "isr_retenido" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "iva_retenido" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "payment_form" character varying`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "payment_method" character varying`);
        await queryRunner.query(`ALTER TABLE "request_approvals" ALTER COLUMN "amount_snapshot" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "approval_levels" ALTER COLUMN "min_amount_mon" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "approval_levels" ALTER COLUMN "max_amount_mon" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "vouchers" ALTER COLUMN "amount" TYPE numeric(12,2)`);

        // 4. FK consolidation — recreate with correct onDelete rules
        await queryRunner.query(`CREATE INDEX "IDX_5525d5fe12604a2d0994d35cbd" ON "roles_permissions" ("id_role")`);
        await queryRunner.query(`CREATE INDEX "IDX_507d63eb2d694cea010feac80e" ON "roles_permissions" ("id_permission")`);
        await queryRunner.query(`ALTER TABLE "cost_centers" ADD CONSTRAINT "FK_7c6525c0a074f5e88385c3ba485" FOREIGN KEY ("id_company") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_5525d5fe12604a2d0994d35cbd2" FOREIGN KEY ("id_role") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_507d63eb2d694cea010feac80e9" FOREIGN KEY ("id_permission") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_9bc572eee16b92a17ee67773388" FOREIGN KEY ("id_ceco") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f8a3754f51a266a160e71d261f8" FOREIGN KEY ("id_role") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_0ab7be063b1e03d4125c7d47067" FOREIGN KEY ("id_travel_agency") REFERENCES "travel_agencies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_b9e12c28cda5eb73ffbab4a663a" FOREIGN KEY ("id_company") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        // 5. current_approval_level_id on requests
        await queryRunner.query(`ALTER TABLE "requests" ADD "current_approval_level_id" uuid NULL`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_requests_current_approval_level" FOREIGN KEY ("current_approval_level_id") REFERENCES "approval_levels"("id") ON DELETE SET NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 5 reversed
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_requests_current_approval_level"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "current_approval_level_id"`);

        // 4 reversed — drop new constraints
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_b9e12c28cda5eb73ffbab4a663a"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_0ab7be063b1e03d4125c7d47067"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f8a3754f51a266a160e71d261f8"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_9bc572eee16b92a17ee67773388"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_507d63eb2d694cea010feac80e9"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_5525d5fe12604a2d0994d35cbd2"`);
        await queryRunner.query(`ALTER TABLE "cost_centers" DROP CONSTRAINT "FK_7c6525c0a074f5e88385c3ba485"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_507d63eb2d694cea010feac80e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5525d5fe12604a2d0994d35cbd"`);

        // 4 reversed — revert voucher columns
        await queryRunner.query(`ALTER TABLE "vouchers" ALTER COLUMN "amount" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "approval_levels" ALTER COLUMN "max_amount_mon" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "approval_levels" ALTER COLUMN "min_amount_mon" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "request_approvals" ALTER COLUMN "amount_snapshot" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "payment_method"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "payment_form"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "iva_retenido"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "isr_retenido"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "ieps_trasladado"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "iva_trasladado"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "discount"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "exchange_rate"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP COLUMN "receiver_name"`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "retention_amount" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD "tax_amount" numeric(12,2)`);

        // 4 reversed — restore old FK constraints
        await queryRunner.query(`CREATE INDEX "IDX_507d63eb2d694cea010feac80e" ON "roles_permissions" ("id_permission")`);
        await queryRunner.query(`CREATE INDEX "IDX_5525d5fe12604a2d0994d35cbd" ON "roles_permissions" ("id_role")`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_5525d5fe12604a2d0994d35cbd2" FOREIGN KEY ("id_role") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_507d63eb2d694cea010feac80e9" FOREIGN KEY ("id_permission") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_9bc572eee16b92a17ee67773388" FOREIGN KEY ("id_ceco") REFERENCES "cost_centers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f8a3754f51a266a160e71d261f8" FOREIGN KEY ("id_role") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_0ab7be063b1e03d4125c7d47067" FOREIGN KEY ("id_travel_agency") REFERENCES "travel_agencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_b9e12c28cda5eb73ffbab4a663a" FOREIGN KEY ("id_company") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cost_centers" ADD CONSTRAINT "FK_7c6525c0a074f5e88385c3ba485" FOREIGN KEY ("id_company") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        // 3 reversed
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_company_admin"`);

        // 2 reversed
        await queryRunner.query(`ALTER TABLE "requests_destinations" DROP COLUMN "provider_support_checked_at"`);
        await queryRunner.query(`ALTER TABLE "requests_destinations" DROP COLUMN "provider_support_reason"`);
        await queryRunner.query(`ALTER TABLE "requests_destinations" DROP COLUMN "provider_support_status"`);

        // 1 reversed
        await queryRunner.query(`ALTER TABLE "request_approvals" RENAME COLUMN "decision" TO "descision"`);
    }
}
