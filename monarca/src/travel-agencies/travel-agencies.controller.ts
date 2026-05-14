/**
 * FileName: travel-agencies.controller.ts
 * Description: Controller for travel agency endpoints. Handles CRUD operations:
 *              create (POST /travel-agencies), findAll (GET /travel-agencies),
 *              findOne (GET /travel-agencies/:id), update (PATCH /travel-agencies/:id)
 *              and remove (DELETE /travel-agencies/:id).
 * Authors: Original Monarca team
 * Last Modification made:
 * 23/04/2026 [Diego de la Vega] Added the REST endpoint implementation for flights requests.
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TravelAgenciesService } from './travel-agencies.service';
import { TravelAgenciesFlightsService } from './travel-agencies-flights.service';
import {
  CreateTravelAgencyDto,
  UpdateTravelAgencyDto,
} from './dto/travel-agency.dtos';
import { ProviderFlightQueryDto } from './dto/provider-flight-query.dto';
import { CompareRequestDto } from './dto/compare-request.dto';
import { FlightSearchMultiSegmentDto } from './dto/flight-search-multi-segment.dto';

@Controller('travel-agencies')
export class TravelAgenciesController {
  constructor(
    private readonly travelAgenciesService: TravelAgenciesService,
    private readonly travelAgenciesFlightsService: TravelAgenciesFlightsService,
  ) {}

  @Post()
  @HttpCode(200)
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

  @Post('flights/search')
  @HttpCode(200)
  searchFlights(@Body() query: ProviderFlightQueryDto) {
    return this.travelAgenciesFlightsService.searchFlights(query);
  }

  @Post('flights/search-multi-segment')
  @HttpCode(200)
  searchFlightsMultiSegment(@Body() query: FlightSearchMultiSegmentDto) {
    return this.travelAgenciesFlightsService.searchFlightsMultiSegment(query);
  }

  @Post('flights/compare')
  @HttpCode(200)
  compareOffers(@Body() body: CompareRequestDto) {
    return this.travelAgenciesFlightsService.compareOffers(body);
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
