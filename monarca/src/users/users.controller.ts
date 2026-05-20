/**
 * FileName: users.controller.ts
 * Description: Controller for user endpoints. Handles read and write operations:
 *              findAll (GET /users), findOne (GET /users/:id),
 *              update (PATCH /users/:id) and remove (DELETE /users/:id).
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dtos';
import { ImportUserDto } from './dto/import-user.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';
import { CompanyAdminGuard } from 'src/guards/company-admin.guard';
import { RequestInterface } from 'src/guards/interfaces/request.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  get() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.delete(id);
  }

  @Post('import')
  @HttpCode(200)
  @UseGuards(AuthGuard, PermissionsGuard, CompanyAdminGuard)
  importUsers(@Body() users: ImportUserDto[], @Req() req: RequestInterface) {
    return this.usersService.importUsers(users, req.userInfo.id_company);
  }
}
