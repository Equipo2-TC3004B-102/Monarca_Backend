/**
 * FileName: requests.module.ts
 * Description: Module for travel request business logic. Handles request creation,
 *              role-based retrieval, updates, and status changes with auditing.
 * Authors: Original Monarca team
 * Last Modification made:
 * 21/05/2026 [Julio Rodriguez] Added UserLogsModule to record request creation in the company admin audit log.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { ApprovalLevel } from 'src/approval-engine/entities/approval-level.entity';
import { RequestApproval } from 'src/approval-engine/entities/request-approval.entity';
import { GuardsModule } from 'src/guards/guards.module';
import { UsersModule } from 'src/users/users.module';
import { DestinationsModule } from 'src/destinations/destinations.module';
import { RequestsChecks } from './requests.checks';
import { RequestsStatusController } from './requests.status.controller';
import { RequestsStatusService } from './requests.status.service';
import { TravelAgenciesChecks } from 'src/travel-agencies/travel-agencies.checks';
import { TravelAgenciesModule } from 'src/travel-agencies/travel-agencies.module';
import { RequestLogsModule } from 'src/request-logs/request-logs.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UserLogsModule } from 'src/user-logs/user-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Request, RequestsDestination, ApprovalLevel, RequestApproval]),
    GuardsModule,
    UsersModule,
    DestinationsModule,
    TravelAgenciesModule,
    RequestLogsModule,
    NotificationsModule,
    UserLogsModule,
  ],
  controllers: [RequestsController, RequestsStatusController],
  providers: [RequestsService, RequestsChecks, RequestsStatusService],
  exports: [RequestsService, RequestsChecks],
})
export class RequestsModule {}