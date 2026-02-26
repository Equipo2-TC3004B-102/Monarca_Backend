/**
 * requests.module.ts
 * Description: NestJS module that bundles all request-related components including
 * controllers (RequestsController, RequestsStatusController), services (RequestsService,
 * RequestsChecks, RequestsStatusService), entity repositories, and imported modules
 * (Guards, Users, Destinations, TravelAgencies, RequestLogs, Notifications).
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Request } from './entities/request.entity';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { GuardsModule } from 'src/guards/guards.module';
import { UsersModule } from 'src/users/users.module';
import { DestinationsModule } from 'src/destinations/destinations.module';
import { RequestsChecks } from './requests.checks';
import { RequestsStatusController } from './requests.status.controller';
import { RequestsStatusService } from './requests.status.service';
import { TravelAgenciesChecks } from 'src/travel-agencies/travel-agencies.checks';
import { TravelAgenciesModule } from 'src/travel-agencies/travel-agencies.module';
import { RequestLogsModule } from 'src/request-logs/request-logs.module';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Request, RequestsDestination]),
    GuardsModule,
    UsersModule,
    DestinationsModule,
    TravelAgenciesModule,
    RequestLogsModule,
    NotificationsModule,
  ],
  controllers: [RequestsController, RequestsStatusController],
  providers: [RequestsService, RequestsChecks, RequestsStatusService, NotificationsService],
  exports: [RequestsService, RequestsChecks],
})
export class RequestsModule {}