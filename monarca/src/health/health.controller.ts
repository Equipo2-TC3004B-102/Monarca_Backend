/**
 * FileName: health.controller.ts
 * Description: REST controller exposing a public GET /health endpoint that returns
 *              the server and database connection status. Returns 200 when healthy,
 *              503 (Service Unavailable) when the database is unreachable.
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 10/04/2026 – Added error handling with 503 status code (ST-4).
 */

import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * getHealth - Public endpoint to check application and database health.
   * Input: None
   * Output: JSON response with status, database connectivity, and timestamp.
   *         HTTP 200 if database is connected, HTTP 503 otherwise.
   */
  @Get()
  async getHealth(@Res() res: Response) {
    const healthStatus = await this.healthService.checkHealth();

    const httpStatus =
      healthStatus.database === 'connected'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(httpStatus).json(healthStatus);
  }
}

