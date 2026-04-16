/**
 * FileName: health.service.ts
 * Description: Service that checks the health status of the application and its
 *              database connection by executing a simple query against PostgreSQL.
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 10/04/2026 – Added ORM integration to validate database connection (ST-3).
 */

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) { }

  /**
   * checkHealth - Verifies that the server is running and the database is reachable.
   * Input: None
   * Output: Object with status ('up'), database ('connected'), and timestamp (ISO string).
   */
  async checkHealth(): Promise<{
    status: string;
    database: string;
    timestamp: string;
  }> {
    await this.dataSource.query('SELECT 1');

    return {
      status: 'up',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}
