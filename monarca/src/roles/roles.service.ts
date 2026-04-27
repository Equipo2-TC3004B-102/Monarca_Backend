/**
 * FileName: roles.service.ts
 * Description: Service handling business logic for roles and permissions. Provides
 *              CRUD operations for roles and permissions, and manages the many-to-many
 *              assignment between roles and permissions via the roles_permissions join table.
 *              Throws NotFoundException when a resource is not found and ConflictException
 *              when a duplicate name or assignment is detected.
 * Authors: Juan Pablo Narchi
 * Last Modification made:
 * 26/04/2026 [Juan Pablo Narchi] Created file with full CRUD and assignment logic for roles and permissions.
 */

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roles } from './entity/roles.entity';
import { Permission } from './entity/permissions.entity';
import { RolePermission } from './entity/roles_permissions.entity';
import {
  CreateRoleDto,
  UpdateRoleDto,
  CreatePermissionDto,
  UpdatePermissionDto,
} from './dto/roles.dtos';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Roles)
    private readonly rolesRepo: Repository<Roles>,
    @InjectRepository(Permission)
    private readonly permissionsRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
  ) {}

  // ── Roles ──────────────────────────────────────────────────────────────────

  /**
   * findAllRoles - Returns all roles with their associated permissions.
   * Input: none
   * Output: Promise<Roles[]> - array of all roles including their permissions relation.
   */
  findAllRoles() {
    return this.rolesRepo.find({ relations: ['permissions'] });
  }

  /**
   * findOneRole - Finds a single role by its UUID including its permissions.
   * Input: id (string) - UUID of the role to find.
   * Output: Promise<Roles> - the role entity with permissions. Throws NotFoundException if not found.
   */
  async findOneRole(id: string) {
    const role = await this.rolesRepo.findOne({
      where: { id: id as any },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  /**
   * createRole - Creates a new role after verifying no duplicate name exists.
   * Input: dto (CreateRoleDto) - object containing the role name.
   * Output: Promise<Roles> - the newly created role entity. Throws ConflictException if name is taken.
   */
  async createRole(dto: CreateRoleDto) {
    const existing = await this.rolesRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Role '${dto.name}' already exists`);
    const role = this.rolesRepo.create(dto);
    return this.rolesRepo.save(role);
  }

  /**
   * updateRole - Updates the name of an existing role.
   * Input: id (string) - UUID of the role; dto (UpdateRoleDto) - fields to update.
   * Output: Promise<Roles> - the updated role entity. Throws NotFoundException if role not found.
   */
  async updateRole(id: string, dto: UpdateRoleDto) {
    await this.findOneRole(id);
    await this.rolesRepo.update(id, dto);
    return this.findOneRole(id);
  }

  /**
   * removeRole - Deletes a role by its UUID.
   * Input: id (string) - UUID of the role to delete.
   * Output: Promise<{ status: boolean, message: string }> - confirmation object. Throws NotFoundException if not found.
   */
  async removeRole(id: string) {
    await this.findOneRole(id);
    await this.rolesRepo.delete(id);
    return { status: true, message: `Role ${id} deleted` };
  }

  // ── Permissions ────────────────────────────────────────────────────────────

  /**
   * findAllPermissions - Returns all permissions in the system.
   * Input: none
   * Output: Promise<Permission[]> - array of all permission entities.
   */
  findAllPermissions() {
    return this.permissionsRepo.find();
  }

  /**
   * findOnePermission - Finds a single permission by its UUID.
   * Input: id (string) - UUID of the permission to find.
   * Output: Promise<Permission> - the permission entity. Throws NotFoundException if not found.
   */
  async findOnePermission(id: string) {
    const perm = await this.permissionsRepo.findOne({ where: { id: id as any } });
    if (!perm) throw new NotFoundException(`Permission ${id} not found`);
    return perm;
  }

  /**
   * createPermission - Creates a new permission after verifying no duplicate name exists.
   * Input: dto (CreatePermissionDto) - object containing the permission name.
   * Output: Promise<Permission> - the newly created permission entity. Throws ConflictException if name is taken.
   */
  async createPermission(dto: CreatePermissionDto) {
    const existing = await this.permissionsRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Permission '${dto.name}' already exists`);
    const perm = this.permissionsRepo.create(dto);
    return this.permissionsRepo.save(perm);
  }

  /**
   * updatePermission - Updates the name of an existing permission.
   * Input: id (string) - UUID of the permission; dto (UpdatePermissionDto) - fields to update.
   * Output: Promise<Permission> - the updated permission entity. Throws NotFoundException if not found.
   */
  async updatePermission(id: string, dto: UpdatePermissionDto) {
    await this.findOnePermission(id);
    await this.permissionsRepo.update(id, dto);
    return this.findOnePermission(id);
  }

  /**
   * removePermission - Deletes a permission by its UUID.
   * Input: id (string) - UUID of the permission to delete.
   * Output: Promise<{ status: boolean, message: string }> - confirmation object. Throws NotFoundException if not found.
   */
  async removePermission(id: string) {
    await this.findOnePermission(id);
    await this.permissionsRepo.delete(id);
    return { status: true, message: `Permission ${id} deleted` };
  }

  // ── Role ↔ Permission assignments ─────────────────────────────────────────

  /**
   * assignPermissionToRole - Creates a roles_permissions record linking a permission to a role.
   *                          Verifies both the role and permission exist before assigning.
   * Input: roleId (string) - UUID of the role; permissionId (string) - UUID of the permission.
   * Output: Promise<Roles> - the updated role entity including its permissions.
   *         Throws ConflictException if the permission is already assigned.
   */
  async assignPermissionToRole(roleId: string, permissionId: string) {
    await this.findOneRole(roleId);
    await this.findOnePermission(permissionId);

    const existing = await this.rolePermissionRepo.findOne({
      where: { id_role: roleId, id_permission: permissionId },
    });
    if (existing) throw new ConflictException('Permission already assigned to role');

    const rp = this.rolePermissionRepo.create({
      id_role: roleId,
      id_permission: permissionId,
    });
    await this.rolePermissionRepo.save(rp);
    return this.findOneRole(roleId);
  }

  /**
   * removePermissionFromRole - Deletes the roles_permissions record for a given role-permission pair.
   * Input: roleId (string) - UUID of the role; permissionId (string) - UUID of the permission.
   * Output: Promise<Roles> - the updated role entity without the removed permission.
   *         Throws NotFoundException if the assignment does not exist.
   */
  async removePermissionFromRole(roleId: string, permissionId: string) {
    await this.findOneRole(roleId);
    await this.findOnePermission(permissionId);

    const rp = await this.rolePermissionRepo.findOne({
      where: { id_role: roleId, id_permission: permissionId },
    });
    if (!rp) throw new NotFoundException('Assignment not found');

    await this.rolePermissionRepo.delete({ id_role: roleId, id_permission: permissionId });
    return this.findOneRole(roleId);
  }
}
