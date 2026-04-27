/**
 * FileName: permissions.controller.ts
 * Description: REST controller for permissions management. Exposes CRUD endpoints for
 *              permissions as a standalone resource. All routes are protected by
 *              AuthGuard and PermissionsGuard.
 * Authors: Juan Pablo Narchi
 * Last Modification made:
 * 26/04/2026 [Juan Pablo Narchi] Created file with CRUD endpoints for permissions.
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
import { CreatePermissionDto, UpdatePermissionDto } from './dto/roles.dtos';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';

@ApiTags('permissions')
@UseGuards(AuthGuard, PermissionsGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly rolesService: RolesService) {}

  /**
   * findAll - Returns all permissions in the system.
   * Input: none
   * Output: Promise<Permission[]> - array of all permission entities.
   */
  @Get()
  findAll() {
    return this.rolesService.findAllPermissions();
  }

  /**
   * findOne - Returns a single permission by UUID.
   * Input: id (string, path param) - UUID of the permission.
   * Output: Promise<Permission> - the matching permission entity.
   */
  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.findOnePermission(id);
  }

  /**
   * create - Creates a new permission.
   * Input: dto (CreatePermissionDto) - body containing the permission name.
   * Output: Promise<Permission> - the newly created permission entity.
   */
  @Post()
  create(@Body() dto: CreatePermissionDto) {
    return this.rolesService.createPermission(dto);
  }

  /**
   * update - Updates an existing permission by UUID.
   * Input: id (string, path param) - UUID of the permission;
   *        dto (UpdatePermissionDto) - fields to update.
   * Output: Promise<Permission> - the updated permission entity.
   */
  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.rolesService.updatePermission(id, dto);
  }

  /**
   * remove - Deletes a permission by UUID.
   * Input: id (string, path param) - UUID of the permission to delete.
   * Output: Promise<{ status: boolean, message: string }> - deletion confirmation.
   */
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.removePermission(id);
  }
}
