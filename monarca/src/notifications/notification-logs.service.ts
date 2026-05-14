/**
 * FileName: notification-logs.service.ts
 * Description: Service for managing notification audit logs. Provides methods to create
 *              a log entry when a notification is attempted, update its status upon success
 *              or failure, and query logs by status or recipient for audit purposes.
 * Authors: Juan Pablo Narchi
 * Last Modification made:
 * 26/04/2026 [Juan Pablo Narchi] Created file with full CRUD and query logic for notification logs.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationLog,
  NotificationStatus,
} from './entities/notification-log.entity';

@Injectable()
export class NotificationLogsService {
  constructor(
    @InjectRepository(NotificationLog)
    private readonly repo: Repository<NotificationLog>,
  ) {}

  /**
   * create - Creates a new notification log entry with status PENDING.
   *          Called before each send attempt to ensure traceability even if the process crashes.
   * Input: recipient (string) - email address of the notification recipient;
   *        subject (string) - subject line of the notification.
   * Output: Promise<NotificationLog> - the newly created log entry.
   */
  create(recipient: string, subject: string): Promise<NotificationLog> {
    const log = this.repo.create({ recipient, subject, status: NotificationStatus.PENDING });
    return this.repo.save(log);
  }

  /**
   * markSent - Updates a log entry status to SENT and clears any previous error details.
   * Input: id (string) - UUID of the log entry to update.
   * Output: Promise<NotificationLog> - the updated log entry.
   */
  markSent(id: string): Promise<NotificationLog> {
    return this.repo.save({ id, status: NotificationStatus.SENT, error_details: null });
  }

  /**
   * markFailed - Updates a log entry status to FAILED and stores the error message.
   * Input: id (string) - UUID of the log entry; error (string) - error message from the failed send.
   * Output: Promise<NotificationLog> - the updated log entry with error details.
   */
  markFailed(id: string, error: string): Promise<NotificationLog> {
    return this.repo.save({ id, status: NotificationStatus.FAILED, error_details: error });
  }

  /**
   * markRetrying - Updates a log entry status to RETRYING.
   * Input: id (string) - UUID of the log entry being retried.
   * Output: Promise<NotificationLog> - the updated log entry.
   */
  markRetrying(id: string): Promise<NotificationLog> {
    return this.repo.save({ id, status: NotificationStatus.RETRYING });
  }

  /**
   * findAll - Returns all notification log entries ordered by most recent first.
   * Input: none
   * Output: Promise<NotificationLog[]> - array of all log entries.
   */
  findAll(): Promise<NotificationLog[]> {
    return this.repo.find({ order: { sent_at: 'DESC' } });
  }

  /**
   * findByRecipient - Returns all log entries for a specific recipient email address.
   * Input: recipient (string) - email address to filter by.
   * Output: Promise<NotificationLog[]> - array of logs for that recipient, most recent first.
   */
  findByRecipient(recipient: string): Promise<NotificationLog[]> {
    return this.repo.find({ where: { recipient }, order: { sent_at: 'DESC' } });
  }

  /**
   * findByStatus - Returns all log entries with a specific status.
   * Input: status (NotificationStatus) - status to filter by (pending/sent/failed/retrying).
   * Output: Promise<NotificationLog[]> - array of matching logs, most recent first.
   */
  findByStatus(status: NotificationStatus): Promise<NotificationLog[]> {
    return this.repo.find({ where: { status }, order: { sent_at: 'DESC' } });
  }
}
