/**
 * FileName: revision.entity
 * Description: TypeORM entity representing the 'revisions' database table. Defines
 *              all columns and the ManyToOne relationship to the Request entity.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 17/04/2026 [Julio Rodríguez] Updated UUID typing and relationships with Request and User entities.
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

@Entity({ name: 'revisions' })
export class Revision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'id_user', type: 'uuid' })
  id_user: string;

  @Column({ name: 'id_request', type: 'uuid' })
  id_request: string;

  @Column({ name: 'comment', type: 'varchar' })
  comment: string;

  // Relationships

  // Many revisions can belong to one request
  @ManyToOne(() => Request, (request) => request.revisions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_request' })
  request: Request;

  // Many revisions can be made by one user
  @ManyToOne(() => User, (user) => user.revisions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_user' })
  user: User;
}
