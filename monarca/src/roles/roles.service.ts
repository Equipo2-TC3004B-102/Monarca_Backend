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

  findAllRoles() {
    return this.rolesRepo.find({ relations: ['permissions'] });
  }

  async findOneRole(id: string) {
    const role = await this.rolesRepo.findOne({
      where: { id: id as any },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    return role;
  }

  async createRole(dto: CreateRoleDto) {
    const existing = await this.rolesRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Role '${dto.name}' already exists`);
    const role = this.rolesRepo.create(dto);
    return this.rolesRepo.save(role);
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    await this.findOneRole(id);
    await this.rolesRepo.update(id, dto);
    return this.findOneRole(id);
  }

  async removeRole(id: string) {
    await this.findOneRole(id);
    await this.rolesRepo.delete(id);
    return { status: true, message: `Role ${id} deleted` };
  }

  // ── Permissions ────────────────────────────────────────────────────────────

  findAllPermissions() {
    return this.permissionsRepo.find();
  }

  async findOnePermission(id: string) {
    const perm = await this.permissionsRepo.findOne({ where: { id: id as any } });
    if (!perm) throw new NotFoundException(`Permission ${id} not found`);
    return perm;
  }

  async createPermission(dto: CreatePermissionDto) {
    const existing = await this.permissionsRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Permission '${dto.name}' already exists`);
    const perm = this.permissionsRepo.create(dto);
    return this.permissionsRepo.save(perm);
  }

  async updatePermission(id: string, dto: UpdatePermissionDto) {
    await this.findOnePermission(id);
    await this.permissionsRepo.update(id, dto);
    return this.findOnePermission(id);
  }

  async removePermission(id: string) {
    await this.findOnePermission(id);
    await this.permissionsRepo.delete(id);
    return { status: true, message: `Permission ${id} deleted` };
  }

  // ── Role ↔ Permission assignments ─────────────────────────────────────────

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
