/**
 * FileName: app.module.ts
 * Description: Root module of the Monarca application. Imports and registers all
 *              feature modules, configures TypeORM with PostgreSQL, and sets up
 *              static file serving for uploaded files.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Santiago Coronado Hernández] Changed synchronize value to false 
 */

import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/company-module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Roles } from './roles/entity/roles.entity';
import { TravelAgenciesModule } from './travel-agencies/travel-agencies.module';
import { RequestsModule } from './requests/requests.module';
import { RequestLogsModule } from './request-logs/request-logs.module';
import { VouchersModule } from './vouchers/vouchers.module';
import { User } from './users/entities/user.entity';
import { Company } from './companies/entity/company.entity';
import { UserLogs } from './user-logs/entity/user-logs.entity';
import { Destination } from './destinations/entities/destination.entity';
import { Request } from './requests/entities/request.entity';
import { Reservation } from './reservations/entity/reservations.entity';
import { RequestsDestination } from './requests/entities/requests-destination.entity';
import { Permission } from './roles/entity/permissions.entity';
import { RequestLog } from './request-logs/entities/request-log.entity';
import { DestinationsModule } from './destinations/destinations.module';
import { TravelAgency } from './travel-agencies/entities/travel-agency.entity';
import { ReservationsModule } from './reservations/reservations.module';
import { Voucher } from './vouchers/entities/vouchers.entity';
import { RevisionsModule } from './revisions/revisions.module';
import { Revision } from './revisions/entities/revision.entity';
import { SeedService } from 'seed.service';
import { UserLogsModule } from './user-logs/user-logs.module';
import { RolePermission } from './roles/entity/roles_permissions.entity';
import { GuardsModule } from './guards/guards.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CostCentersModule } from './cost-centers/cost-centers.module';
import { CostCenter } from './cost-centers/entity/cost-centers.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { ExchangeRate } from './exchange-rates/entities/exchange-rate.entity';
import { ApprovalLevel } from './approval-engine/entities/approval-level.entity';
import { ApprovalLevelActor } from './approval-engine/entities/approval-level-actor.entity';
import { RequestApproval } from './approval-engine/entities/request-approval.entity';
import { ApprovalEngineModule } from './approval-engine/approval-engine.module';
import { CompanyNotificationSettingsModule } from './company-notification-settings/company-notification-settings.module';
import { CompanyNotificationSetting } from './company-notification-settings/entities/company-notification-setting.entity';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/files',
    }),
    NotificationsModule,
    HealthModule,
    AuthModule,
    UsersModule,
    TravelAgenciesModule,
    Roles,
    CostCentersModule,
    RequestsModule,
    RequestLogsModule,
    ReservationsModule,
    VouchersModule,
    RevisionsModule,
    DestinationsModule,
    UserLogsModule,
    GuardsModule,
    CompaniesModule,
    ApprovalEngineModule,
    CompanyNotificationSettingsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5433,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      entities: [
        User,
        Company,
        CompanyNotificationSetting,
        CostCenter,
        Destination,
        ExchangeRate,
        Request,
        RequestsDestination,
        Roles,
        RolePermission,
        Permission,
        Reservation,
        RequestLog,
        TravelAgency,
        Voucher,
        UserLogs,
        Revision,
        ApprovalLevel,
        ApprovalLevelActor,
        RequestApproval,
      ],
      synchronize: false, // False for migrations.
      retryAttempts: 3,
      retryDelay: 3000,
    }),

    TypeOrmModule.forFeature([
      User,
      CompanyNotificationSetting,
      CostCenter,
      Destination,
      ExchangeRate,
      Request,
      RequestsDestination,
      Roles,
      RolePermission,
      Permission,
      Reservation,
      RequestLog,
      TravelAgency,
      Voucher,
      UserLogs,
      Revision,
      ApprovalLevel,
      ApprovalLevelActor,
      RequestApproval,
    ]),

  ],
  controllers: [],
  providers: [SeedService],
})
export class AppModule { }
