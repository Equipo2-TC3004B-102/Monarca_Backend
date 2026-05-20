/**
 * FileName: notification-log.entity.ts
 * Description: TypeORM entity representing the notification_logs table. Records each
 *              email notification attempt with its recipient, subject, status
 *              (pending/sent/failed/retrying), timestamp, and error details for
 *              full traceability and audit support.
 * Authors: Juan Pablo Narchi
 * Last Modification made:
 * 26/04/2026 [Juan Pablo Narchi] Created file with NotificationLog entity and NotificationStatus enum.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recipient: string;

  @Column()
  subject: string;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @CreateDateColumn()
  sent_at: Date;

  @Column({ type: 'text', nullable: true })
  error_details: string | null;
}
