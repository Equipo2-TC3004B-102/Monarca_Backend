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

  create(recipient: string, subject: string): Promise<NotificationLog> {
    const log = this.repo.create({ recipient, subject, status: NotificationStatus.PENDING });
    return this.repo.save(log);
  }

  markSent(id: string): Promise<NotificationLog> {
    return this.repo.save({ id, status: NotificationStatus.SENT, error_details: null });
  }

  markFailed(id: string, error: string): Promise<NotificationLog> {
    return this.repo.save({ id, status: NotificationStatus.FAILED, error_details: error });
  }

  markRetrying(id: string): Promise<NotificationLog> {
    return this.repo.save({ id, status: NotificationStatus.RETRYING });
  }

  findAll(): Promise<NotificationLog[]> {
    return this.repo.find({ order: { sent_at: 'DESC' } });
  }

  findByRecipient(recipient: string): Promise<NotificationLog[]> {
    return this.repo.find({ where: { recipient }, order: { sent_at: 'DESC' } });
  }

  findByStatus(status: NotificationStatus): Promise<NotificationLog[]> {
    return this.repo.find({ where: { status }, order: { sent_at: 'DESC' } });
  }
}
