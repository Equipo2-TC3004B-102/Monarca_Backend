/**
 * FileName: travel-agencies.module.ts
 * Description: Travel Agencies module. Registers the TravelAgency entity with TypeORM,
 *              sets up the controller and services, and exports TravelAgenciesChecks
 *              for use in other modules that need travel agency validation.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Module } from '@nestjs/common';
import { TravelAgenciesService } from './travel-agencies.service';
import { TravelAgenciesController } from './travel-agencies.controller';
import { TravelAgency } from './entities/travel-agency.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TravelAgenciesChecks } from './travel-agencies.checks';

@Module({
  imports: [TypeOrmModule.forFeature([TravelAgency])],
  controllers: [TravelAgenciesController],
  providers: [TravelAgenciesService, TravelAgenciesChecks],
  exports: [TravelAgenciesChecks],
})
export class TravelAgenciesModule {}
