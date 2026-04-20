/**
 * FileName: request-log.entity.ts
 * Description: TypeORM entity representing the request_logs table. Stores a history
 *              of status changes for requests, including who made the change, when,
 *              and what the new status was. Belongs to a Request via id_request.
 * Authors: Original Monarca team
 * Last Modification made:
 * 17/04/2026 [Julio Rodríguez] Added strict UUID typing and User relationship for audit ownership.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Request } from 'src/requests/entities/request.entity';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'request_logs' })
export class RequestLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_request', type: 'uuid' })
  id_request: string;

  @Column({ name: 'id_user', type: 'uuid' })
  id_user: string;

  @Column({
    name: 'report',
    type: 'varchar',
    nullable: true,
  })
  report: string | null;

  @Column({ name: 'new_status', type: 'varchar' })
  new_status: string;

  @Column({
    name: 'change_date',
    type: 'timestamptz', // Changed to timestamptz for better timezone handling
    default: () => 'CURRENT_TIMESTAMP',
  })
  change_date: Date;

  // Relationships

  // Many logs can belong to one request
  @ManyToOne(() => Request, (request) => request.requestLogs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_request' })
  request: Request;

  // Many logs can be made by one user
  @ManyToOne(() => User, (user) => user.request_logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_user' })
  user: User;
}
