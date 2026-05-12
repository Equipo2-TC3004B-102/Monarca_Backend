/**
 * FileName: 1780800000000-Database_v4.ts
 * Description: Removes the legacy RBAC tables (roles, permissions, roles_permissions)
 *              and the users.id_role column. Access control is now handled exclusively
 *              via boolean flags on the User entity and the FLAG_PERMISSIONS map in
 *              PermissionsGuard — no runtime DB join to these tables is performed.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 06/05/2026 [Julio Rodriguez] Created migration to drop unused RBAC tables.
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseV41780800000000 implements MigrationInterface {
  name = 'DatabaseV41780800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop FK from users.id_role → roles.id
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f8a3754f51a266a160e71d261f8"`);
    // Drop indexes on roles_permissions
    await queryRunner.query(`DROP INDEX "public"."IDX_5525d5fe12604a2d0994d35cbd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_507d63eb2d694cea010feac80e"`);
    // Drop FKs on roles_permissions
    await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_5525d5fe12604a2d0994d35cbd2"`);
    await queryRunner.query(`ALTER TABLE "roles_permissions" DROP CONSTRAINT "FK_507d63eb2d694cea010feac80e9"`);
    // Drop id_role column from users
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id_role"`);
    // Drop RBAC tables
    await queryRunner.query(`DROP TABLE "roles_permissions"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "roles_permissions" ("id_role" uuid NOT NULL, "id_permission" uuid NOT NULL, CONSTRAINT "PK_75a62b5204ec9a5e68105632f57" PRIMARY KEY ("id_role", "id_permission"))`);
    await queryRunner.query(`CREATE INDEX "IDX_5525d5fe12604a2d0994d35cbd" ON "roles_permissions" ("id_role")`);
    await queryRunner.query(`CREATE INDEX "IDX_507d63eb2d694cea010feac80e" ON "roles_permissions" ("id_permission")`);
    await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_5525d5fe12604a2d0994d35cbd2" FOREIGN KEY ("id_role") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "roles_permissions" ADD CONSTRAINT "FK_507d63eb2d694cea010feac80e9" FOREIGN KEY ("id_permission") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    // id_role is restored as nullable because original role assignments cannot be recovered
    await queryRunner.query(`ALTER TABLE "users" ADD "id_role" uuid`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f8a3754f51a266a160e71d261f8" FOREIGN KEY ("id_role") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }
}
