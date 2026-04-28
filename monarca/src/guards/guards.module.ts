/**
 * FileName: guards.module.ts
 * Description: Module that registers and exports all guards used across the application.
 * Authors: Original Monarca team
 * Last Modification made:
 * 22/04/2026 [Julio Rodríguez] Added SystemAdminGuard and CompanyAdminGuard for flag-based authorization.
 */

import { Module } from '@nestjs/common';
import { JwtConfigModule } from 'src/jwt/jwt.config.module';
import { AuthGuard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { SystemAdminGuard } from './system-admin.guard';
import { CompanyAdminGuard } from './company-admin.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [JwtConfigModule, TypeOrmModule.forFeature([User])],
  providers: [AuthGuard, PermissionsGuard, SystemAdminGuard, CompanyAdminGuard],
  exports: [
    AuthGuard,
    PermissionsGuard,
    SystemAdminGuard,
    CompanyAdminGuard,
    JwtConfigModule,
    TypeOrmModule.forFeature([User]),
  ],
})
export class GuardsModule {}
