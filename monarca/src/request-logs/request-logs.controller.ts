/**
 * FileName: request-logs.controller.ts
 * Description: Controller for request log endpoints. Handles read operations:
 *              findAll (GET /request-logs) and findOne (GET /request-logs/:id).
 * Authors: Original Monarca team
 * Last Modification made:
 * 17/04/2026 [Julio Rodríguez] Removed unused imports to align with backend coding standard.
 */

import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RequestLogsService } from './request-logs.service';

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
