/**
 * FileName: destinations.controller.ts
 * Description: Controller for destination endpoints. Handles CRUD operations:
 *              create (POST /destinations), findAll (GET /destinations),
 *              findOne (GET /destinations/:id), update (PATCH /destinations/:id)
 *              and remove (DELETE /destinations/:id).
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
  ParseUUIDPipe,
} from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destService: DestinationsService) {}

  @Post()
  create(@Body() data: CreateDestinationDto) {
    return this.destService.create(data);
  }

  @Get()
  findAll() {
    return this.destService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.destService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateDestinationDto,
  ) {
    return this.destService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.destService.remove(id);
  }
}
