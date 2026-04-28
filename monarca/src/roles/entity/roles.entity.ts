/**
 * FileName: roles.entity.ts
 * Description: TypeORM entity representing the roles table. A role has a name and
 *              can have many permissions associated through a ManyToMany relationship
 *              via the roles_permissions join table.
 * Authors: Original Monarca team
 * Last Modification made:
 * 22/04/2026 [Julio Rodríguez] Fixed id type from number to string to match UUID primary key.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { RolePermission } from './roles_permissions.entity';
import { Permission } from './permissions.entity';

@Entity('roles')
export class Roles {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Approver' })
  @Column()
  name: string;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'roles_permissions',
    joinColumn: { name: 'id_role', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'id_permission', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];
}
