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
