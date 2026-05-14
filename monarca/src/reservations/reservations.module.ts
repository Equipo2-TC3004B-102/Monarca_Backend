/**
 * FileName: reservations.module
 * Description: NestJS module that registers ReservationsController and ReservationsService,
 *              imports the TypeORM repository for the Reservation entity, and includes
 *              RequestsModule and GuardsModule for business-logic checks and route protection.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 14/05/2026 [Diego de la Vega] Added RequestsDestination to TypeORM feature imports so the
 *                               service can update provider_support_status on reservation creation.
 */

import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from './entity/reservations.entity';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { RequestsModule } from 'src/requests/requests.module';
import { GuardsModule } from 'src/guards/guards.module';

@Module({
  imports: [TypeOrmModule.forFeature([Reservation, RequestsDestination]), RequestsModule, GuardsModule],
  providers: [ReservationsService],
  controllers: [ReservationsController],
})
export class ReservationsModule {}
