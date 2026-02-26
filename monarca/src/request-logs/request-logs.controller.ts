/**
 * FileName: request-logs.controller.ts
 * Description: Controller for request log endpoints. Handles read operations:
 *              findAll (GET /request-logs) and findOne (GET /request-logs/:id).
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestLogsService } from './request-logs.service';
import { CreateRequestLogDto } from './dto/create-request-log.dto';
import { UpdateRequestLogDto } from './dto/update-request-log.dto';

@Controller('request-logs')
export class RequestLogsController {
  constructor(private readonly logsService: RequestLogsService) {}

  @Get()
  async findAll() {
    return this.logsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.logsService.findOne(id);
  }
}
