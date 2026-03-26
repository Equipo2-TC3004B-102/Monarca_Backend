/**
 * FileName: user-logs.entity.ts
 * Description: TypeORM entity representing the user_logs table. Stores user activity
 *              logs including the user, date, IP address and a report description.
 *              Belongs to a User via id_user.
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
import { User } from 'src/users/entities/user.entity';

@Entity({ name: 'user_logs' })
export class UserLogs {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  id_user: number;

  // TODO: update relationship once user entity is finalized
  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'id_user' })
  user: User;

  @Column()
  date: Date;

  @Column()
  ip: string;

  @Column()
  report: string;
}
