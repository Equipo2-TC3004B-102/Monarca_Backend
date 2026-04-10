/**
 * FileName: health.service.ts
 * Description: Service that checks the health status of the application and its
 *              database connection by executing a simple query against PostgreSQL.
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 10/04/2026 – Added error handling for database connection failures (ST-4).
 */

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * checkHealth - Verifies that the server is running and the database is reachable.
   * Input: None
   * Output: Object with status ('up'), database ('connected' | 'disconnected'),
   *         timestamp (ISO string), and an optional error message.
   */
  async checkHealth(): Promise<{
    status: string;
    database: string;
    timestamp: string;
    error?: string;
  }> {
    const timestamp = new Date().toISOString();

    try {
      await this.dataSource.query('SELECT 1');

      return {
        status: 'up',
        database: 'connected',
        timestamp,
      };
    } catch (error) {
      return {
        status: 'up',
        database: 'disconnected',
        timestamp,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }
}

