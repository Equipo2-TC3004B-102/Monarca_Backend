/**
 * FileName: travel-agencies.service.spec.ts
 * Description: Unit tests for TravelAgenciesService. Verifies that the service
 *              is correctly instantiated within a NestJS testing module.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Sergio Jiawei Xuan] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TravelAgenciesService } from './travel-agencies.service';

describe('TravelAgenciesService', () => {
  let service: TravelAgenciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TravelAgenciesService],
    }).compile();

    service = module.get<TravelAgenciesService>(TravelAgenciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
