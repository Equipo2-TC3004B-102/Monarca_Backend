/**
 * FileName: 1777483252633-Database_v3.ts
 * Description: Adds the notification_logs table used by NotificationsService to audit
 *              every email send attempt. Each row stores the recipient, subject, status
 *              (pending/sent/failed/retrying), creation timestamp, and optional error
 *              details for traceability of the email pipeline.
 * Authors: Juan Pablo Narchi
 * Last Modification made:
 * 29/04/2026 [Juan Pablo Narchi] Created migration to add notification_logs table and its status enum.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseV31777483252633 implements MigrationInterface {
    name = 'DatabaseV31777483252633';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."notification_logs_status_enum" AS ENUM('pending', 'sent', 'failed', 'retrying')`);
        await queryRunner.query(`CREATE TABLE "notification_logs" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "recipient" character varying NOT NULL,
            "subject" character varying NOT NULL,
            "status" "public"."notification_logs_status_enum" NOT NULL DEFAULT 'pending',
            "sent_at" TIMESTAMP NOT NULL DEFAULT now(),
            "error_details" text,
            CONSTRAINT "PK_notification_logs_id" PRIMARY KEY ("id")
        )`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "notification_logs"`);
        await queryRunner.query(`DROP TYPE "public"."notification_logs_status_enum"`);
    }
}
