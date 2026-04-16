import { MigrationInterface, QueryRunner } from "typeorm";

export class ApprovalEngineBase1776309300000 implements MigrationInterface {
    name = 'ApprovalEngineBase1776309300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "approval_levels" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "code" character varying NOT NULL,
            "name" character varying NOT NULL,
            "description" character varying,
            "applies_to" character varying NOT NULL DEFAULT 'travel',
            "level_order" integer NOT NULL,
            "min_amount_mon" numeric(12,2),
            "max_amount_mon" numeric(12,2),
            "required_approvals" integer NOT NULL DEFAULT 1,
            "escalation_hours" integer,
            "is_active" boolean NOT NULL DEFAULT true,
            "effective_from" date NOT NULL,
            "effective_to" date,
            "company_id" uuid NOT NULL,
            CONSTRAINT "PK_approval_levels_id" PRIMARY KEY ("id"),
            CONSTRAINT "CHK_approval_levels_required_approvals" CHECK ("required_approvals" > 0),
            CONSTRAINT "CHK_approval_levels_amount_range" CHECK (
              "min_amount_mon" IS NULL OR "max_amount_mon" IS NULL OR "min_amount_mon" <= "max_amount_mon"
            ),
            CONSTRAINT "CHK_approval_levels_effective_dates" CHECK (
              "effective_to" IS NULL OR "effective_to" >= "effective_from"
            )
        )`);

        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_approval_levels_company_code" ON "approval_levels" ("company_id", "code")`);
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "UQ_approval_levels_company_applies_order" ON "approval_levels" ("company_id", "applies_to", "level_order")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_approval_levels_company_id" ON "approval_levels" ("company_id")`);
        await queryRunner.query(`ALTER TABLE "approval_levels"
            ADD CONSTRAINT "FK_approval_levels_company_id"
            FOREIGN KEY ("company_id") REFERENCES "companies"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "approval_levels_actors" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "approval_level_id" uuid NOT NULL,
            "company_id" uuid NOT NULL,
            "actor_type" character varying NOT NULL,
            "is_required" boolean NOT NULL DEFAULT true,
            "required_count" integer,
            "selection_mode" character varying NOT NULL DEFAULT 'ANY',
            "ceco_id" uuid,
            "escalation_step" integer NOT NULL DEFAULT 0,
            "is_active" boolean NOT NULL DEFAULT true,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_approval_levels_actors_id" PRIMARY KEY ("id"),
            CONSTRAINT "CHK_approval_levels_actors_required_count" CHECK (
              "required_count" IS NULL OR "required_count" > 0
            ),
            CONSTRAINT "CHK_approval_levels_actors_escalation_step" CHECK ("escalation_step" >= 0)
        )`);

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_approval_levels_actors_level_id" ON "approval_levels_actors" ("approval_level_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_approval_levels_actors_company_id" ON "approval_levels_actors" ("company_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_approval_levels_actors_ceco_id" ON "approval_levels_actors" ("ceco_id")`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors"
            ADD CONSTRAINT "FK_approval_levels_actors_level_id"
            FOREIGN KEY ("approval_level_id") REFERENCES "approval_levels"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors"
            ADD CONSTRAINT "FK_approval_levels_actors_company_id"
            FOREIGN KEY ("company_id") REFERENCES "companies"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors"
            ADD CONSTRAINT "FK_approval_levels_actors_ceco_id"
            FOREIGN KEY ("ceco_id") REFERENCES "cost_centers"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "request_approvals" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "id_request" uuid NOT NULL,
            "id_approval_level" uuid NOT NULL,
            "id_approval_actor_rule" uuid,
            "id_approver_user" uuid NOT NULL,
            "decision" character varying NOT NULL,
            "comment" character varying,
            "amount_snapshot" numeric(12,2) NOT NULL,
            "currency_snapshot" character varying NOT NULL,
            "status" character varying NOT NULL DEFAULT 'PENDING',
            "escalation_step" integer NOT NULL DEFAULT 0,
            "decided_at" TIMESTAMP,
            CONSTRAINT "PK_request_approvals_id" PRIMARY KEY ("id"),
            CONSTRAINT "CHK_request_approvals_escalation_step" CHECK ("escalation_step" >= 0)
        )`);

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_request_approvals_request_id" ON "request_approvals" ("id_request")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_request_approvals_level_id" ON "request_approvals" ("id_approval_level")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_request_approvals_actor_rule_id" ON "request_approvals" ("id_approval_actor_rule")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_request_approvals_approver_user_id" ON "request_approvals" ("id_approver_user")`);
        await queryRunner.query(`ALTER TABLE "request_approvals"
            ADD CONSTRAINT "FK_request_approvals_request_id"
            FOREIGN KEY ("id_request") REFERENCES "requests"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_approvals"
            ADD CONSTRAINT "FK_request_approvals_level_id"
            FOREIGN KEY ("id_approval_level") REFERENCES "approval_levels"("id")
            ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_approvals"
            ADD CONSTRAINT "FK_request_approvals_actor_rule_id"
            FOREIGN KEY ("id_approval_actor_rule") REFERENCES "approval_levels_actors"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_approvals"
            ADD CONSTRAINT "FK_request_approvals_approver_user_id"
            FOREIGN KEY ("id_approver_user") REFERENCES "users"("id")
            ON DELETE RESTRICT ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "submitted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "current_approval_level_id" uuid`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_requests_current_approval_level_id" ON "requests" ("current_approval_level_id")`);
        await queryRunner.query(`ALTER TABLE "requests"
            ADD CONSTRAINT "FK_requests_current_approval_level_id"
            FOREIGN KEY ("current_approval_level_id") REFERENCES "approval_levels"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT IF EXISTS "FK_requests_current_approval_level_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_requests_current_approval_level_id"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN IF EXISTS "current_approval_level_id"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN IF EXISTS "updated_at"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP COLUMN IF EXISTS "submitted_at"`);

        await queryRunner.query(`ALTER TABLE "request_approvals" DROP CONSTRAINT IF EXISTS "FK_request_approvals_approver_user_id"`);
        await queryRunner.query(`ALTER TABLE "request_approvals" DROP CONSTRAINT IF EXISTS "FK_request_approvals_actor_rule_id"`);
        await queryRunner.query(`ALTER TABLE "request_approvals" DROP CONSTRAINT IF EXISTS "FK_request_approvals_level_id"`);
        await queryRunner.query(`ALTER TABLE "request_approvals" DROP CONSTRAINT IF EXISTS "FK_request_approvals_request_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_request_approvals_approver_user_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_request_approvals_actor_rule_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_request_approvals_level_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_request_approvals_request_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "request_approvals"`);

        await queryRunner.query(`ALTER TABLE "approval_levels_actors" DROP CONSTRAINT IF EXISTS "FK_approval_levels_actors_ceco_id"`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors" DROP CONSTRAINT IF EXISTS "FK_approval_levels_actors_company_id"`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors" DROP CONSTRAINT IF EXISTS "FK_approval_levels_actors_level_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_approval_levels_actors_ceco_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_approval_levels_actors_company_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_approval_levels_actors_level_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "approval_levels_actors"`);

        await queryRunner.query(`ALTER TABLE "approval_levels" DROP CONSTRAINT IF EXISTS "FK_approval_levels_company_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_approval_levels_company_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_approval_levels_company_applies_order"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."UQ_approval_levels_company_code"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "approval_levels"`);
    }

}
