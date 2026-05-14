/*
 * Filename: 1777936987279-CompanyNotificationSettings.ts
 * Description: Migration file to create the company_notification_settings table, which stores notification preferences for each company.
 * Authors: DebugStudio team
 * Last Modification made: [04/05/2026] [Jinsik Yoon] Initial creation of the migration file.
 */

import { MigrationInterface, QueryRunner } from "typeorm";

export class CompanyNotificationSettings1777936987279 implements MigrationInterface {
  name = 'CompanyNotificationSettings1777936987279'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "company_notification_settings" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "id_company" uuid NOT NULL,
        "email_enabled" boolean NOT NULL DEFAULT true,
        "in_app_enabled" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_company_notification_settings_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_company_notification_settings_company" UNIQUE ("id_company"),
        CONSTRAINT "FK_company_notification_settings_company"
          FOREIGN KEY ("id_company") REFERENCES "companies"("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "company_notification_settings"
    `);
  }
}