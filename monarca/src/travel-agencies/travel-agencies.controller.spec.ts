/**
 * FileName: travel-agencies.controller.spec.ts
 * Description: Unit tests for TravelAgenciesController. Verifies that the controller
 *              is correctly instantiated within a NestJS testing module.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TravelAgenciesController } from './travel-agencies.controller';
import { TravelAgenciesService } from './travel-agencies.service';

describe('TravelAgenciesController', () => {
  let controller: TravelAgenciesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TravelAgenciesController],
      providers: [TravelAgenciesService],
    }).compile();

    controller = module.get<TravelAgenciesController>(TravelAgenciesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
