import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyNotificationTypes1780000000000 implements MigrationInterface {
  name = 'AddCompanyNotificationTypes1780000000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "company_notification_settings" ADD COLUMN "email_requests_created" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "company_notification_settings" ADD COLUMN "email_requests_status" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "company_notification_settings" ADD COLUMN "email_revisions" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "company_notification_settings" ADD COLUMN "email_reservations" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "company_notification_settings" ADD COLUMN "email_admin_alerts" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "company_notification_settings" DROP COLUMN "email_admin_alerts"`);
    await queryRunner.query(`ALTER TABLE "company_notification_settings" DROP COLUMN "email_reservations"`);
    await queryRunner.query(`ALTER TABLE "company_notification_settings" DROP COLUMN "email_revisions"`);
    await queryRunner.query(`ALTER TABLE "company_notification_settings" DROP COLUMN "email_requests_status"`);
    await queryRunner.query(`ALTER TABLE "company_notification_settings" DROP COLUMN "email_requests_created"`);
  }
}
