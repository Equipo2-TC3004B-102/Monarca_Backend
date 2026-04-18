/**
 * FileName: destinations.controller.ts
 * Description: Controller for destination endpoints. Handles CRUD operations:
 *              create (POST /destinations), findAll (GET /destinations),
 *              findOne (GET /destinations/:id), update (PATCH /destinations/:id)
 *              and remove (DELETE /destinations/:id).
 * Authors: Original Monarca team
 * Last Modification made:
 * 11/04/2026 [Julio Rodriguez] Standardized explicit HTTP success code for
 *                              POST endpoint and aligned header format.
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
  HttpCode,
} from '@nestjs/common';
import { DestinationsService } from './destinations.service';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';

@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destService: DestinationsService) {}

  @Post()
  @HttpCode(200)
  create(@Body() createDestinationDto: CreateDestinationDto) {
    return this.destService.create(createDestinationDto);
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
