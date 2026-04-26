import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import {
  CreatePermissionDto,
  CreateRoleDto,
  UpdatePermissionDto,
  UpdateRoleDto,
  AssignPermissionToRoleDto,
  AssignRoleToUserDto,
} from './dto/roles.dtos';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { UsersService } from 'src/users/users.service';

@ApiTags('roles')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly usersService: UsersService,
  ) {}

  // ── Roles ──────────────────────────────────────────────────────────────────

  @Get()
  findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  @Get(':id')
  findOneRole(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.findOneRole(id);
  }

  @Post()
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Patch(':id')
  updateRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, dto);
  }

  @Delete(':id')
  removeRole(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.removeRole(id);
  }

  // ── Role ↔ Permission assignments ─────────────────────────────────────────

  @Post(':id/permissions')
  assignPermission(
    @Param('id', new ParseUUIDPipe()) roleId: string,
    @Body() dto: AssignPermissionToRoleDto,
  ) {
    return this.rolesService.assignPermissionToRole(roleId, dto.id_permission);
  }

  @Delete(':id/permissions/:permissionId')
  removePermission(
    @Param('id', new ParseUUIDPipe()) roleId: string,
    @Param('permissionId', new ParseUUIDPipe()) permissionId: string,
  ) {
    return this.rolesService.removePermissionFromRole(roleId, permissionId);
  }

  // ── User ↔ Role assignment ─────────────────────────────────────────────────

  @Post('users/:userId/role')
  assignRoleToUser(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: AssignRoleToUserDto,
  ) {
    return this.usersService.update(userId, { id_role: dto.id_role });
  }
}
