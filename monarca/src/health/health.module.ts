/**
 * FileName: health.module.ts
 * Description: NestJS module that registers HealthController and HealthService.
 *              Provides a public health-check endpoint for monitoring server
 *              and database connectivity.
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 26/03/2026 – Initial creation for Requerimiento 27.
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule { }
