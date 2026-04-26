import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { NotificationLogsService } from './notification-logs.service';
import { NotificationStatus } from './entities/notification-log.entity';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';

@ApiTags('notification-logs')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('notification-logs')
export class NotificationLogsController {
  constructor(private readonly logsService: NotificationLogsService) {}

  @Get()
  @ApiQuery({ name: 'status', enum: NotificationStatus, required: false })
  @ApiQuery({ name: 'recipient', type: String, required: false })
  findAll(
    @Query('status') status?: NotificationStatus,
    @Query('recipient') recipient?: string,
  ) {
    if (status) return this.logsService.findByStatus(status);
    if (recipient) return this.logsService.findByRecipient(recipient);
    return this.logsService.findAll();
  }
}
