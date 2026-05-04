/**
 * FileName: travel-agencies.service.spec.ts
 * Description: Unit tests for TravelAgenciesService. Verifies that the service
 *              is correctly instantiated within a NestJS testing module.
 * Authors: Original Monarca team
 * Last Modification made:
 * 23/04/2026 [Diego de la Vega] With help of Github Copilot, added a mock repository provider to ensure that TravelAgenciesService is defined inside a valid testing module.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TravelAgenciesService } from './travel-agencies.service';
import { TravelAgency } from './entities/travel-agency.entity';

describe('TravelAgenciesService', () => {
  let service: TravelAgenciesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TravelAgenciesService,
        {
          provide: getRepositoryToken(TravelAgency),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TravelAgenciesService>(TravelAgenciesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
