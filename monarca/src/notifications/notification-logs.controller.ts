/**
 * FileName: notification-logs.controller.ts
 * Description: REST controller for querying notification audit logs. Exposes a GET endpoint
 *              that returns all notification log entries, with optional filtering by status
 *              or recipient email for audit and debugging purposes.
 *              All routes are protected by AuthGuard and PermissionsGuard.
 * Authors: Juan Pablo Narchi
 * Last Modification made:
 * 26/04/2026 [Juan Pablo Narchi] Created file with query endpoint for notification logs.
 */

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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

  /**
   * findAll - Returns notification log entries, optionally filtered by status or recipient.
   *           If both filters are provided, status takes precedence.
   * Input: status (NotificationStatus, optional query param) - filter by status;
   *        recipient (string, optional query param) - filter by recipient email.
   * Output: Promise<NotificationLog[]> - array of matching log entries ordered by most recent first.
   */
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
