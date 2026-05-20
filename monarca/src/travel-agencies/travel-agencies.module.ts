/**
 * FileName: travel-agencies.module.ts
 * Description: Travel Agencies module. Registers the TravelAgency entity with TypeORM,
 *              sets up the controller and services, and exports TravelAgenciesChecks
 *              for use in other modules that need travel agency validation.
 * Authors: Original Monarca team
 * Last Modification made:
 * 23/04/2026 [Diego de la Vega] Added the NestJS module to call the flights orchestrator and providers.
 */

import { Module } from '@nestjs/common';
import { TravelAgenciesService } from './travel-agencies.service';
import { TravelAgenciesController } from './travel-agencies.controller';
import { TravelAgency } from './entities/travel-agency.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TravelAgenciesChecks } from './travel-agencies.checks';
import { DuffelProvider } from './providers/duffel.provider';
import { TRAVEL_AGENCIES_PROVIDER_ADAPTERS } from './providers/travel-agencies-provider.token';
import { TravelAgenciesFlightsService } from './travel-agencies-flights.service';

@Module({
  imports: [TypeOrmModule.forFeature([TravelAgency])],
  controllers: [TravelAgenciesController],
  providers: [
    TravelAgenciesService,
    TravelAgenciesChecks,
    DuffelProvider,
    TravelAgenciesFlightsService,
    {
      provide: TRAVEL_AGENCIES_PROVIDER_ADAPTERS,
      useFactory: (duffelProvider: DuffelProvider) => [duffelProvider],
      inject: [DuffelProvider],
    },
  ],
  exports: [TravelAgenciesChecks],
})
export class TravelAgenciesModule {}
