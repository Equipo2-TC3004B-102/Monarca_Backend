/**
 * FileName: travel-agencies.controller.ts
 * Description: Controller for travel agency endpoints. Handles CRUD operations:
 *              create (POST /travel-agencies), findAll (GET /travel-agencies),
 *              findOne (GET /travel-agencies/:id), update (PATCH /travel-agencies/:id)
 *              and remove (DELETE /travel-agencies/:id).
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
import { TravelAgenciesService } from './travel-agencies.service';
import {
  CreateTravelAgencyDto,
  UpdateTravelAgencyDto,
} from './dto/travel-agency.dtos';

@Controller('travel-agencies')
export class TravelAgenciesController {
  constructor(private readonly travelAgenciesService: TravelAgenciesService) {}

  @Post()
  create(@Body() createTravelAgencyDto: CreateTravelAgencyDto) {
    return this.travelAgenciesService.create(createTravelAgencyDto);
  }

  @Get()
  async findAll() {
    return await this.travelAgenciesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.travelAgenciesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTravelAgencyDto: UpdateTravelAgencyDto,
  ) {
    return this.travelAgenciesService.update(id, updateTravelAgencyDto);
  }

  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.travelAgenciesService.remove(id);
  }
}
