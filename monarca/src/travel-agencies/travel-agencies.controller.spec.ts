/**
 * FileName: travel-agencies.controller.spec.ts
 * Description: Unit tests for TravelAgenciesController. Verifies that the controller is correctly instantiated within a NestJS testing module.
 * Authors: Original Monarca team
 * Last Modification made:
 * 23/04/2026 [Diego de la Vega] Adapted test file to ensure the controller wiring is correct and Nest can build it with its dependencies.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { TravelAgenciesController } from './travel-agencies.controller';
import { TravelAgenciesService } from './travel-agencies.service';
import { TravelAgenciesFlightsService } from './travel-agencies-flights.service';

describe('TravelAgenciesController', () => {
  let controller: TravelAgenciesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TravelAgenciesController],
      providers: [
        {
          provide: TravelAgenciesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: TravelAgenciesFlightsService,
          useValue: { searchFlights: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<TravelAgenciesController>(TravelAgenciesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
