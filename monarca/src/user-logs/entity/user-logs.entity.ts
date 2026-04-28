/**
 * FileName: user-logs.entity.ts
 * Description: TypeORM entity representing the user_logs table. Stores user activity
 *              logs including the user, date, IP address and a report description.
 *              Belongs to a User via id_user.
 * Authors: Original Monarca team
 * Last Modification made:
 * 17/04/2026 [Julio Rodríguez] Updated UUID typing and relationship mapping with User.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'user_logs' })
export class UserLogs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_user', type: 'uuid' })
  id_user: string;

  // Updated relationship mapping to User entity for consistency with User entity's primary key type
  @ManyToOne(() => User, (user) => user.user_logs, { onDelete: 'CASCADE'})
  @JoinColumn({ name: 'id_user' })
  user: User;

  @Column({ name: 'date', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ name: 'ip', type: 'varchar' })
  ip: string;

  @Column({ name: 'report', type: 'varchar' })
  report: string;
}
