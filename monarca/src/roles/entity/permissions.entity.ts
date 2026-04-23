/**
 * FileName: permissions.entity.ts
 * Description: TypeORM entity representing the permissions table. A permission has
 *              a name and can be associated to many roles through the
 *              roles_permissions join table.
 * Authors: Original Monarca team
 * Last Modification made:
 * 22/04/2026 [Julio Rodríguez] Fixed id type from number to string to match UUID primary key.
 */

import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RolePermission } from './roles_permissions.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => RolePermission, (rp) => rp.role)
  rolePermissions: RolePermission[];
}
