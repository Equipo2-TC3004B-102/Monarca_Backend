/**
 * FileName: request-log.entity.ts
 * Description: TypeORM entity representing the request_logs table. Stores a history
 *              of status changes for requests, including who made the change, when,
 *              and what the new status was. Belongs to a Request via id_request.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';

@Entity({ name: 'request_logs' })
export class RequestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_request' })
  id_request: string;

  @Column({ name: 'id_user' })
  id_user: string;

  @Column({
    name: 'report',
    type: 'varchar',
    nullable: true,
  })
  report: string | null;

  @Column({ name: 'new_status' })
  new_status: string;

  @Column({
    name: 'change_date',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  change_date: string;

  // Relationships
  @ManyToOne(() => Request, (request) => request.requestLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_request' })
  request: Request;
}
