/**
 * FileName: health.controller.ts
 * Description: REST controller exposing a public GET /health endpoint that returns
 *              the server status.
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 26/03/2026 – Initial creation for Requerimiento 27.
 */

import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * getHealth - Public endpoint to check application health.
   * Input: None
   * Output: JSON response with status and timestamp.
   */
  @Get()
  getHealth() {
    return this.healthService.checkHealth();
  }
}
