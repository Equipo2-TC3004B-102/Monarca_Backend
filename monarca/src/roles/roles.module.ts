/**
 * FileName: roles.module.ts
 * Description: Roles module. Registers the Roles and Permission entities with TypeORM.
 *              Note: currently does not export anything, which may cause issues if
 *              other modules need direct access to these entities.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from './entity/roles.entity';
import { Permission } from './entity/permissions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Roles, Permission])],
  providers: [],
  exports: [],
})
export class RolesModule {}
