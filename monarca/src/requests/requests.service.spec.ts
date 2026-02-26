/**
 * requests.service.spec.ts
 * Description: Unit test file for the RequestsService. Verifies that the service
 * is correctly instantiated within the NestJS testing module.
 * Authors: Original Monarca team
 * Last Modification made:
 * 25/02/2026 [Juan Pablo Narchi Capote] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RequestsService } from './requests.service';

describe('RequestsService', () => {
  let service: RequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequestsService],
    }).compile();

    service = module.get<RequestsService>(RequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
