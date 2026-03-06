/**
 * FileName: request-logs.module.ts
 * Description: Request Logs module. Registers the RequestLog entity with TypeORM,
 *              sets up the controller and service, and exports both TypeOrmModule
 *              and RequestLogsService for use in other modules.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestLog } from './entities/request-log.entity';
import { RequestLogsService } from './request-logs.service';
import { RequestLogsController } from './request-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RequestLog])],
  controllers: [RequestLogsController],
  providers: [RequestLogsService],
  exports: [TypeOrmModule, RequestLogsService],
})
export class RequestLogsModule {}
