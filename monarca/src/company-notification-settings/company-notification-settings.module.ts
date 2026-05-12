/*
 * Filename: company-notification-settings.module.ts
 * Description: Module file for the company notification settings feature.
 * Authors: DebugStudio team
 * Last Modification made: [04/05/2026] [Jinsik Yoon] Initial creation of the module file.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyNotificationSetting } from './entities/company-notification-setting.entity';
import { CompanyNotificationSettingsService } from './company-notification-settings.service';
import { CompanyNotificationSettingsController } from './company-notification-settings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyNotificationSetting]),
  ],
  controllers: [CompanyNotificationSettingsController],
  providers: [CompanyNotificationSettingsService],
  exports: [CompanyNotificationSettingsService],
})
export class CompanyNotificationSettingsModule {}
