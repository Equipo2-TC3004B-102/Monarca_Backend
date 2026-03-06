/**
 * FileName: destinations.module.ts
 * Description: Destinations module. Registers the Destination entity with TypeORM,
 *              sets up the controller and service, and exports DestinationsChecks
 *              for use in other modules that need destination validation.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Destination } from './entities/destination.entity';
import { DestinationsService } from './destinations.service';
import { DestinationsController } from './destinations.controller';
import { DestinationsChecks } from './destinations.checks';

@Module({
  imports: [TypeOrmModule.forFeature([Destination])],
  providers: [DestinationsService, DestinationsChecks],
  controllers: [DestinationsController],
  exports: [DestinationsChecks],
})
export class DestinationsModule {}
