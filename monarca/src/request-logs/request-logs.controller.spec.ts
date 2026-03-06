/**
 * FileName: request-logs.controller.spec.ts
 * Description: Unit tests for RequestLogsController. Verifies that the controller
 *              is correctly instantiated within a NestJS testing module.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RequestLogsController } from './request-logs.controller';
import { RequestLogsService } from './request-logs.service';

describe('RequestLogsController', () => {
  let controller: RequestLogsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestLogsController],
      providers: [RequestLogsService],
    }).compile();

    controller = module.get<RequestLogsController>(RequestLogsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
