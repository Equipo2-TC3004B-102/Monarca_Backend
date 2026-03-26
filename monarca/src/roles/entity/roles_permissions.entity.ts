/**
 * FileName: roles_permissions.entity.ts
 * Description: TypeORM entity representing the roles_permissions join table.
 *              Defines the ManyToMany relationship between Roles and Permissions
 *              using a composite primary key of id_role and id_permission.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Roles } from './roles.entity';
import { Permission } from './permissions.entity';

@Entity('roles_permissions')
export class RolePermission {
  @PrimaryColumn()
  id_role: string;

  @PrimaryColumn()
  id_permission: string;

  @ManyToOne(() => Roles, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_role' })
  role: Roles;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'id_permission' })
  permission: Permission;
}
