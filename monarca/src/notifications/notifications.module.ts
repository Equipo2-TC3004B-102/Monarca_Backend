import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationLogsService } from './notification-logs.service';
import { NotificationLogsController } from './notification-logs.controller';
import { NotificationLog } from './entities/notification-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationLog])],
  controllers: [NotificationsController, NotificationLogsController],
  providers: [NotificationsService, NotificationLogsService],
  exports: [NotificationsService, NotificationLogsService],
})
export class NotificationsModule {}
