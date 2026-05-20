/**
 * FileName: notifications.module.ts
 * Description: NestJS module for handling all notification-related functionality in Monarca.
 *              This module encapsulates services and controllers for sending emails,
 * Authors: Original Monarca team
 * Last Modification made:
 * 05/05/2026 [Santiago Coronado Hernández] Added the CompanyNotificationSettingsModule to the 
 *            imports to allow notification services to access company notification settings
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationLogsService } from './notification-logs.service';
import { NotificationLogsController } from './notification-logs.controller';
import { NotificationLog } from './entities/notification-log.entity';
import { GuardsModule } from 'src/guards/guards.module';
import { CompanyNotificationSettingsModule } from 'src/company-notification-settings/company-notification-settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationLog]), GuardsModule, CompanyNotificationSettingsModule],
  controllers: [NotificationsController, NotificationLogsController],
  providers: [NotificationsService, NotificationLogsService],
  exports: [NotificationsService, NotificationLogsService],
})
export class NotificationsModule {}
