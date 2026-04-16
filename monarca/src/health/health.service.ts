/**
 * FileName: health.service.ts
 * Description: Service that checks the health status of the application.
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 26/03/2026 – Initial creation for Requerimiento 27.
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  /**
   * checkHealth - Returns the current server status.
   * Input: None
   * Output: Object with status ('up') and timestamp (ISO string).
   */
  checkHealth(): { status: string; timestamp: string } {
    return {
      status: 'up',
      timestamp: new Date().toISOString(),
    };
  }
}
