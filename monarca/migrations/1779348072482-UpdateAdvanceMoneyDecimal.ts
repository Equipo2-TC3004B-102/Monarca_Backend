import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAdvanceMoneyDecimal1779348072482 implements MigrationInterface {
    name = 'UpdateAdvanceMoneyDecimal1779348072482'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "approval_levels" DROP CONSTRAINT "FK_1400cb5c3c7ca56ba8c13f35c71"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_requests_current_approval_level"`);
        await queryRunner.query(`ALTER TABLE "company_notification_settings" DROP CONSTRAINT "FK_company_notification_settings_company"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_9bc572eee16b92a17ee67773388"`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors" DROP CONSTRAINT "FK_c7a3c3095313086193eddf7bbf4"`);
        await queryRunner.query(`ALTER TABLE "cost_centers" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "cost_centers" ALTER COLUMN "name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "request_approvals" ALTER COLUMN "amount_snapshot" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "approval_levels" ALTER COLUMN "min_amount_mon" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "approval_levels" ALTER COLUMN "max_amount_mon" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "advance_money"`);
        await queryRunner.query(`ALTER TABLE "requests" ADD "advance_money" numeric(12,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "unconverted_advance_money"`);
        await queryRunner.query(`ALTER TABLE "requests" ADD "unconverted_advance_money" numeric(12,2)`);
        await queryRunner.query(`ALTER TABLE "voucher_creation_logs" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_9bc572eee16b92a17ee67773388" FOREIGN KEY ("id_ceco") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors" ADD CONSTRAINT "FK_c7a3c3095313086193eddf7bbf4" FOREIGN KEY ("ceco_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval_levels" ADD CONSTRAINT "FK_1400cb5c3c7ca56ba8c13f35c71" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_abcf57b8afa34f56d1d91a0bfbe" FOREIGN KEY ("current_approval_level_id") REFERENCES "approval_levels"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_notification_settings" ADD CONSTRAINT "FK_d3979862c9d514cd4c876d28290" FOREIGN KEY ("id_company") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company_notification_settings" DROP CONSTRAINT "FK_d3979862c9d514cd4c876d28290"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_abcf57b8afa34f56d1d91a0bfbe"`);
        await queryRunner.query(`ALTER TABLE "approval_levels" DROP CONSTRAINT "FK_1400cb5c3c7ca56ba8c13f35c71"`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors" DROP CONSTRAINT "FK_c7a3c3095313086193eddf7bbf4"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_9bc572eee16b92a17ee67773388"`);
        await queryRunner.query(`ALTER TABLE "voucher_creation_logs" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "unconverted_advance_money"`);
        await queryRunner.query(`ALTER TABLE "requests" ADD "unconverted_advance_money" integer`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN "advance_money"`);
        await queryRunner.query(`ALTER TABLE "requests" ADD "advance_money" integer NOT NULL`);
        await queryRunner.query(`ALTER TABLE "approval_levels" ALTER COLUMN "max_amount_mon" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "approval_levels" ALTER COLUMN "min_amount_mon" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "request_approvals" ALTER COLUMN "amount_snapshot" TYPE numeric`);
        await queryRunner.query(`ALTER TABLE "cost_centers" ALTER COLUMN "name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "cost_centers" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors" ADD CONSTRAINT "FK_c7a3c3095313086193eddf7bbf4" FOREIGN KEY ("ceco_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_9bc572eee16b92a17ee67773388" FOREIGN KEY ("id_ceco") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_notification_settings" ADD CONSTRAINT "FK_company_notification_settings_company" FOREIGN KEY ("id_company") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_requests_current_approval_level" FOREIGN KEY ("current_approval_level_id") REFERENCES "approval_levels"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval_levels" ADD CONSTRAINT "FK_1400cb5c3c7ca56ba8c13f35c71" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
