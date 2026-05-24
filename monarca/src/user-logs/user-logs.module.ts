/**
 * FileName: user-logs.module.ts
 * Description: User Logs module. Registers the UserLogs entity with TypeORM
 *              and sets up the controller and service.
 * Authors: Original Monarca team
 * Last Modification made:
 * 21/05/2026 [Julio Rodríguez] Added module to handle user logs for auditing purposes across the application, including login/logout actions and request status changes. This module will be imported into other modules like AuthModule and RequestsModule to enable logging functionality.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLogs } from './entity/user-logs.entity';
import { UserLogsService } from './user-logs.service';
import { UserLogsController } from './user-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserLogs])],
  providers: [UserLogsService],
  controllers: [UserLogsController],
  exports: [UserLogsService],
})
export class UserLogsModule {}
