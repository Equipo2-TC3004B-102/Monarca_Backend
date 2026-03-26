/**
 * FileName: users.module.ts
 * Description: Users module. Registers the User entity with TypeORM, sets up
 *              the controller and services, and exports UserChecks and UsersService
 *              for use in other modules that need user data or validation.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserChecks } from './user.checks.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DepartmentsModule } from 'src/departments/departments.module';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), DepartmentsModule, RolesModule],
  controllers: [UsersController],
  providers: [UserChecks, UsersService],
  exports: [UserChecks, UsersService],
})
export class UsersModule {}
