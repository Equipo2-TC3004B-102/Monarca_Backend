/**
 * guards.module.ts
 * Description: NestJS module that bundles the authentication and authorization guards
 * (AuthGuard, PermissionsGuard). Imports JwtConfigModule for JWT verification and
 * TypeOrmModule with the User entity for permission lookups. Exports guards and
 * dependencies so other modules can use them.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import { Module } from '@nestjs/common';
import { JwtConfigModule } from 'src/jwt/jwt.config.module';
import { AuthGuard } from './auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [JwtConfigModule, TypeOrmModule.forFeature([User])],
  providers: [AuthGuard, PermissionsGuard],
  exports: [
    AuthGuard,
    PermissionsGuard,
    JwtConfigModule,
    TypeOrmModule.forFeature([User]),
  ],
})
export class GuardsModule {}
