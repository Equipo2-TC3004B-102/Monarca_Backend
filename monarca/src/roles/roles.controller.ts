/**
 * FileName: roles.controller.ts
 * Description: REST controller for roles management. Exposes CRUD endpoints for roles,
 *              endpoints to assign and remove permissions from roles, and an endpoint to
 *              assign a role to a user. All routes are protected by AuthGuard and PermissionsGuard.
 * Authors: Juan Pablo Narchi
 * Last Modification made:
 * 26/04/2026 [Juan Pablo Narchi] Created file with CRUD and assignment endpoints for roles.
 */

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

  /**
   * findAllRoles - Returns all roles with their associated permissions.
   * Input: none
   * Output: Promise<Roles[]> - array of all roles.
   */
  @Get()
  findAllRoles() {
    return this.rolesService.findAllRoles();
  }

  /**
   * findOneRole - Returns a single role by UUID.
   * Input: id (string, path param) - UUID of the role.
   * Output: Promise<Roles> - the matching role with permissions.
   */
  @Get(':id')
  findOneRole(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.findOneRole(id);
  }

  /**
   * createRole - Creates a new role.
   * Input: dto (CreateRoleDto) - body containing the role name.
   * Output: Promise<Roles> - the newly created role.
   */
  @Post()
  createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  /**
   * updateRole - Updates an existing role by UUID.
   * Input: id (string, path param) - UUID of the role; dto (UpdateRoleDto) - fields to update.
   * Output: Promise<Roles> - the updated role.
   */
  @Patch(':id')
  updateRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, dto);
  }

  /**
   * removeRole - Deletes a role by UUID.
   * Input: id (string, path param) - UUID of the role to delete.
   * Output: Promise<{ status: boolean, message: string }> - deletion confirmation.
   */
  @Delete(':id')
  removeRole(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.removeRole(id);
  }

  /**
   * assignPermission - Assigns a permission to a role.
   * Input: id (string, path param) - UUID of the role;
   *        dto (AssignPermissionToRoleDto) - body containing id_permission.
   * Output: Promise<Roles> - the updated role including the newly assigned permission.
   */
  @Post(':id/permissions')
  assignPermission(
    @Param('id', new ParseUUIDPipe()) roleId: string,
    @Body() dto: AssignPermissionToRoleDto,
  ) {
    return this.rolesService.assignPermissionToRole(roleId, dto.id_permission);
  }

  /**
   * removePermission - Removes a permission from a role.
   * Input: id (string, path param) - UUID of the role;
   *        permissionId (string, path param) - UUID of the permission to remove.
   * Output: Promise<Roles> - the updated role without the removed permission.
   */
  @Delete(':id/permissions/:permissionId')
  removePermission(
    @Param('id', new ParseUUIDPipe()) roleId: string,
    @Param('permissionId', new ParseUUIDPipe()) permissionId: string,
  ) {
    return this.rolesService.removePermissionFromRole(roleId, permissionId);
  }

  /**
   * assignRoleToUser - Assigns a role to a user by updating the user's id_role field.
   * Input: userId (string, path param) - UUID of the user;
   *        dto (AssignRoleToUserDto) - body containing id_role.
   * Output: Promise<UserDto> - the updated user entity.
   */
  @Post('users/:userId/role')
  assignRoleToUser(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: AssignRoleToUserDto,
  ) {
    return this.usersService.update(userId, { id_role: dto.id_role });
  }
}
