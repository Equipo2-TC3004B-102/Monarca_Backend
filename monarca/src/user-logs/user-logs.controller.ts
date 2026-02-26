/**
 * FileName: user-logs.controller.ts
 * Description: Controller for user log endpoints. Handles CRUD operations:
 *              create (POST /user-logs), findAll (GET /user-logs),
 *              findOne (GET /user-logs/:id), update (PATCH /user-logs/:id)
 *              and remove (DELETE /user-logs/:id).
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { UserLogsService } from './user-logs.service';
import { CreateUserLogDto } from './dto/create-user-log.dto';
import { UpdateUserLogDto } from './dto/update-user-log.dto';

@Controller('user-logs')
export class UserLogsController {
  constructor(private readonly userLogsService: UserLogsService) {}

  @Post()
  create(@Body() dto: CreateUserLogDto) {
    return this.userLogsService.create(dto);
  }

  @Get()
  findAll() {
    return this.userLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userLogsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserLogDto) {
    return this.userLogsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userLogsService.remove(id);
  }
}
