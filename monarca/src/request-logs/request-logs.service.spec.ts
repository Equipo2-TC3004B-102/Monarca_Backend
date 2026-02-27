/**
 * FileName: request-logs.service.spec.ts
 * Description: Unit tests for RequestLogsService. Verifies that the service
 *              is correctly instantiated within a NestJS testing module.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RequestLogsService } from './request-logs.service';

describe('RequestLogsService', () => {
  let service: RequestLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestLogsService],
    }).compile();

    service = module.get<RequestLogsService>(RequestLogsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
