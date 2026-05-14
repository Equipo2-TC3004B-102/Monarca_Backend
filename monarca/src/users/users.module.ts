/**
 * FileName: users.module.ts
 * Description: Users module. Registers the User entity with TypeORM, sets up
 *              the controller and services, and exports UserChecks and UsersService
 *              for use in other modules that need user data or validation.
 * Authors: Original Monarca team
 * Last Modification made:
 * 03/05/2026 [Julio Rodriguez] Registered CostCenter entity so importUsers can upsert cecos from the JSON.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { CostCenter } from 'src/cost-centers/entity/cost-centers.entity';
import { UserChecks } from './user.checks.service';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, CostCenter]), GuardsModule],
  controllers: [UsersController],
  providers: [UserChecks, UsersService],
  exports: [UserChecks, UsersService],
})
export class UsersModule {}
