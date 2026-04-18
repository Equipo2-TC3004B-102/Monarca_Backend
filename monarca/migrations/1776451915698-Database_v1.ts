/**
 * FileName: 1776451915698-Database_v2.ts
 * Description: Baseline TypeORM migration generated from the current entity
 *              model after consolidating recent backend schema updates.
 *              This version replaces previous incremental migration files.
 * Authors: Debug Studio Team
 * Last Modification made:
 * 17/04/2026 [Julio Rodriguez] Rebuilt migration history into a single Database_v2.
 */

import { MigrationInterface, QueryRunner } from "typeorm";

export class DatabaseV11776451915698 implements MigrationInterface {
    name = 'DatabaseV11776451915698'
    /**
     * up - Creates the complete baseline schema aligned with current entities.
     * Input: queryRunner (QueryRunner) - TypeORM query runner.
     * Output: Promise<void> when all DDL statements are executed.
     */
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "reservations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "comments" character varying NOT NULL, "link" character varying NOT NULL, "price" double precision NOT NULL, "id_request_destination" uuid NOT NULL, CONSTRAINT "PK_da95cef71b617ac35dc5bcda243" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "destinations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "country" character varying NOT NULL, "city" character varying NOT NULL, CONSTRAINT "PK_69c5e8db964dcb83d3a0640f3c7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "requests_destinations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_destination" uuid NOT NULL, "id_request" uuid NOT NULL, "destination_order" integer NOT NULL, "stay_days" integer NOT NULL, "arrival_date" TIMESTAMP NOT NULL, "departure_date" TIMESTAMP NOT NULL, "is_hotel_required" boolean NOT NULL DEFAULT true, "is_plane_required" boolean NOT NULL DEFAULT true, "is_last_destination" boolean NOT NULL DEFAULT false, "details" character varying, CONSTRAINT "PK_965ae5d9a1a9129ed8f05f1cbed" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "local_currency" character varying NOT NULL, CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "cost_centers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "id_company" uuid NOT NULL, CONSTRAINT "PK_e70f55c677c255c1f81f0ed1ccb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "revisions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_user" uuid NOT NULL, "id_request" uuid NOT NULL, "comment" character varying NOT NULL, CONSTRAINT "PK_4aa9ee2c71c50508c3c501573c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles_permissions" ("id_role" uuid NOT NULL, "id_permission" uuid NOT NULL, CONSTRAINT "PK_75a62b5204ec9a5e68105632f57" PRIMARY KEY ("id_role", "id_permission"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "travel_agencies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_c61634d62e12b61afa34acacb02" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_user" uuid NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ip" character varying NOT NULL, "report" character varying NOT NULL, CONSTRAINT "PK_773dbba6ad8ad2cdecfef243953" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "name" character varying NOT NULL, "last_name" character varying NOT NULL, "password" character varying NOT NULL, "status" character varying NOT NULL, "employee_num" character varying, "user_name" character varying NOT NULL, "creation_date" date NOT NULL DEFAULT ('now'::text)::date, "id_ceco" uuid, "id_role" uuid NOT NULL, "id_travel_agency" uuid, "id_company" uuid, "provider" character varying, "manager_id" uuid, "is_system_admin" boolean NOT NULL DEFAULT false, "is_first_login" boolean NOT NULL DEFAULT true, "is_requester" boolean NOT NULL DEFAULT true, "is_approver" boolean NOT NULL DEFAULT false, "is_soi" boolean NOT NULL DEFAULT false, "is_travelAgent" boolean NOT NULL DEFAULT false, "first_login_at" TIMESTAMP, "last_login_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "request_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_request" uuid NOT NULL, "id_user" uuid NOT NULL, "report" character varying, "new_status" character varying NOT NULL, "change_date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1edd3815ae37a9b9511f5a26dca" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_user" uuid NOT NULL, "id_origin_city" uuid NOT NULL, "id_admin" uuid NOT NULL, "id_SOI" uuid NOT NULL, "id_travel_agency" uuid, "id_company" uuid NOT NULL, "title" character varying NOT NULL, "motive" character varying NOT NULL, "advance_money" integer NOT NULL, "currency" character varying, "exchange_rate" double precision, "unconverted_advance_money" integer, "status" character varying NOT NULL DEFAULT 'Pending Review', "requirements" character varying, "priority" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0428f484e96f9e6a55955f29b5f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vouchers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "id_request" uuid NOT NULL, "class" character varying NOT NULL, "amount" numeric NOT NULL, "tax_type" character varying NOT NULL, "currency" character varying NOT NULL, "date" TIMESTAMP WITH TIME ZONE NOT NULL, "file_url_pdf" character varying, "file_url_xml" character varying, "status" character varying NOT NULL, "id_approver" uuid, CONSTRAINT "PK_ed1b7dd909a696560763acdbc04" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "exchange_rates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "currency" character varying(3) NOT NULL, "exchange_rate" numeric(19,6) NOT NULL, "update_date" date NOT NULL DEFAULT ('now'::text)::date, CONSTRAINT "PK_33a614bad9e61956079d817ebe2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_exchange_rates_currency_date" ON "exchange_rates" ("currency", "update_date") `);
        await queryRunner.query(`CREATE TABLE "approval_levels_actors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "approval_level_id" uuid NOT NULL, "actor_type" character varying NOT NULL, "target_type" character varying, "target_id" uuid, "is_required" boolean NOT NULL DEFAULT true, "required_count" integer, "selection_mode" character varying NOT NULL DEFAULT 'any', "ceco_id" uuid, "escalation_step" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_14503aa6130538c3485482b4ea2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "approval_levels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "name" character varying NOT NULL, "company_id" uuid NOT NULL, "description" character varying, "applies_to" character varying NOT NULL DEFAULT 'travel', "level_order" integer NOT NULL, "min_amount_mon" numeric, "max_amount_mon" numeric, "required_approvals" integer NOT NULL DEFAULT '1', "escalation_hours" integer, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b0e46ae53996f7b1f9f5986b094" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "request_approvals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "request_id" uuid NOT NULL, "approval_level_id" uuid NOT NULL, "approval_actor_id" uuid, "approver_user_id" uuid NOT NULL, "descision" character varying NOT NULL, "comments" text, "amount_snapshot" numeric NOT NULL, "currency_snapshot" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'PENDING', "escalation_step" integer NOT NULL DEFAULT '0', "decided_at" TIMESTAMP, CONSTRAINT "PK_569731be3f86c267a23c5d9d39e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5525d5fe12604a2d0994d35cbd" ON "roles_permissions" ("id_role") `);
        await queryRunner.query(`CREATE INDEX "IDX_507d63eb2d694cea010feac80e" ON "roles_permissions" ("id_permission") `);
        await queryRunner.query(`ALTER TABLE "reservations" ADD CONSTRAINT "FK_7829009b5226d86820fc74024a7" FOREIGN KEY ("id_request_destination") REFERENCES "requests_destinations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests_destinations" ADD CONSTRAINT "FK_1bbdc59cbb3fad8362e634515d1" FOREIGN KEY ("id_request") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests_destinations" ADD CONSTRAINT "FK_81942cb36a350e2ad8816c7b70d" FOREIGN KEY ("id_destination") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cost_centers" ADD CONSTRAINT "FK_7c6525c0a074f5e88385c3ba485" FOREIGN KEY ("id_company") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "revisions" ADD CONSTRAINT "FK_8312f6980c3e59663c70e46d40d" FOREIGN KEY ("id_request") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "revisions" ADD CONSTRAINT "FK_2a2f3936a8b89c9e54b6c94b6bd" FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_5525d5fe12604a2d0994d35cbd2" FOREIGN KEY ("id_role") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_507d63eb2d694cea010feac80e9" FOREIGN KEY ("id_permission") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_logs" ADD CONSTRAINT "FK_58fe6e2efc0856dccac8c0aa987" FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_9bc572eee16b92a17ee67773388" FOREIGN KEY ("id_ceco") REFERENCES "cost_centers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f8a3754f51a266a160e71d261f8" FOREIGN KEY ("id_role") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_0ab7be063b1e03d4125c7d47067" FOREIGN KEY ("id_travel_agency") REFERENCES "travel_agencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_b9e12c28cda5eb73ffbab4a663a" FOREIGN KEY ("id_company") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_fba2d8e029689aa8fea98e53c91" FOREIGN KEY ("manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_logs" ADD CONSTRAINT "FK_3b9bf9f9eb34db17f20914ce131" FOREIGN KEY ("id_request") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_logs" ADD CONSTRAINT "FK_718da08b672ca4c3c91b319feaa" FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_f6f6815d9153ee421eaa50c317a" FOREIGN KEY ("id_origin_city") REFERENCES "destinations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_c35389455083da5c76b66dc40d0" FOREIGN KEY ("id_user") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_ed80cac564523ca8ca23772efb1" FOREIGN KEY ("id_admin") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_45f45554e9bf73504cdd6e4459e" FOREIGN KEY ("id_SOI") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_98d7b6c60ee501fa2c24cba4699" FOREIGN KEY ("id_travel_agency") REFERENCES "travel_agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requests" ADD CONSTRAINT "FK_5ecdcaebd237083d34b5b3692f1" FOREIGN KEY ("id_company") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD CONSTRAINT "FK_6ad7785dde9d50d6f95132e48f3" FOREIGN KEY ("id_request") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vouchers" ADD CONSTRAINT "FK_724068c492e4178f876ef6a224a" FOREIGN KEY ("id_approver") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors" ADD CONSTRAINT "FK_88e407d248faa76da0e2ec8e1e9" FOREIGN KEY ("approval_level_id") REFERENCES "approval_levels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors" ADD CONSTRAINT "FK_c7a3c3095313086193eddf7bbf4" FOREIGN KEY ("ceco_id") REFERENCES "cost_centers"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval_levels" ADD CONSTRAINT "FK_1400cb5c3c7ca56ba8c13f35c71" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_approvals" ADD CONSTRAINT "FK_40bb76e5a8a4295fe71cf9c114e" FOREIGN KEY ("request_id") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_approvals" ADD CONSTRAINT "FK_959ac49e18baf8117b523a2145e" FOREIGN KEY ("approval_level_id") REFERENCES "approval_levels"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_approvals" ADD CONSTRAINT "FK_a1f0611983744124aa2b3988624" FOREIGN KEY ("approval_actor_id") REFERENCES "approval_levels_actors"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "request_approvals" ADD CONSTRAINT "FK_8002ee210e4f775184ab2afed53" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    /**
     * down - Drops baseline objects in reverse order.
     * Input: queryRunner (QueryRunner) - TypeORM query runner.
     * Output: Promise<void> when rollback statements are executed.
     */
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "request_approvals" DROP CONSTRAINT "FK_8002ee210e4f775184ab2afed53"`);
        await queryRunner.query(`ALTER TABLE "request_approvals" DROP CONSTRAINT "FK_a1f0611983744124aa2b3988624"`);
        await queryRunner.query(`ALTER TABLE "request_approvals" DROP CONSTRAINT "FK_959ac49e18baf8117b523a2145e"`);
        await queryRunner.query(`ALTER TABLE "request_approvals" DROP CONSTRAINT "FK_40bb76e5a8a4295fe71cf9c114e"`);
        await queryRunner.query(`ALTER TABLE "approval_levels" DROP CONSTRAINT "FK_1400cb5c3c7ca56ba8c13f35c71"`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors" DROP CONSTRAINT "FK_c7a3c3095313086193eddf7bbf4"`);
        await queryRunner.query(`ALTER TABLE "approval_levels_actors" DROP CONSTRAINT "FK_88e407d248faa76da0e2ec8e1e9"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP CONSTRAINT "FK_724068c492e4178f876ef6a224a"`);
        await queryRunner.query(`ALTER TABLE "vouchers" DROP CONSTRAINT "FK_6ad7785dde9d50d6f95132e48f3"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_5ecdcaebd237083d34b5b3692f1"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_98d7b6c60ee501fa2c24cba4699"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_45f45554e9bf73504cdd6e4459e"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_ed80cac564523ca8ca23772efb1"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_c35389455083da5c76b66dc40d0"`);
        await queryRunner.query(`ALTER TABLE "requests" DROP CONSTRAINT "FK_f6f6815d9153ee421eaa50c317a"`);
        await queryRunner.query(`ALTER TABLE "request_logs" DROP CONSTRAINT "FK_718da08b672ca4c3c91b319feaa"`);
        await queryRunner.query(`ALTER TABLE "request_logs" DROP CONSTRAINT "FK_3b9bf9f9eb34db17f20914ce131"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_fba2d8e029689aa8fea98e53c91"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_b9e12c28cda5eb73ffbab4a663a"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_0ab7be063b1e03d4125c7d47067"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f8a3754f51a266a160e71d261f8"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_9bc572eee16b92a17ee67773388"`);
        await queryRunner.query(`ALTER TABLE "user_logs" DROP CONSTRAINT "FK_58fe6e2efc0856dccac8c0aa987"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_507d63eb2d694cea010feac80e9"`);
        await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_5525d5fe12604a2d0994d35cbd2"`);
        await queryRunner.query(`ALTER TABLE "revisions" DROP CONSTRAINT "FK_2a2f3936a8b89c9e54b6c94b6bd"`);
        await queryRunner.query(`ALTER TABLE "revisions" DROP CONSTRAINT "FK_8312f6980c3e59663c70e46d40d"`);
        await queryRunner.query(`ALTER TABLE "cost_centers" DROP CONSTRAINT "FK_7c6525c0a074f5e88385c3ba485"`);
        await queryRunner.query(`ALTER TABLE "requests_destinations" DROP CONSTRAINT "FK_81942cb36a350e2ad8816c7b70d"`);
        await queryRunner.query(`ALTER TABLE "requests_destinations" DROP CONSTRAINT "FK_1bbdc59cbb3fad8362e634515d1"`);
        await queryRunner.query(`ALTER TABLE "reservations" DROP CONSTRAINT "FK_7829009b5226d86820fc74024a7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_507d63eb2d694cea010feac80e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5525d5fe12604a2d0994d35cbd"`);
        await queryRunner.query(`DROP TABLE "request_approvals"`);
        await queryRunner.query(`DROP TABLE "approval_levels"`);
        await queryRunner.query(`DROP TABLE "approval_levels_actors"`);
        await queryRunner.query(`DROP INDEX "public"."idx_exchange_rates_currency_date"`);
        await queryRunner.query(`DROP TABLE "exchange_rates"`);
        await queryRunner.query(`DROP TABLE "vouchers"`);
        await queryRunner.query(`DROP TABLE "requests"`);
        await queryRunner.query(`DROP TABLE "request_logs"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "user_logs"`);
        await queryRunner.query(`DROP TABLE "travel_agencies"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "roles_permissions"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP TABLE "revisions"`);
        await queryRunner.query(`DROP TABLE "cost_centers"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TABLE "requests_destinations"`);
        await queryRunner.query(`DROP TABLE "destinations"`);
        await queryRunner.query(`DROP TABLE "reservations"`);
    }

}
