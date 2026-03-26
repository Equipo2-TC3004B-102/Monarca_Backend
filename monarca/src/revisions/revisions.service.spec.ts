/**
 * FileName: revisions.service.spec
 * Description: Unit tests for RevisionsService. Verifies that the service
 *              is correctly instantiated within a NestJS testing module.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { RevisionsService } from './revisions.service';

describe('RevisionsService', () => {
  let service: RevisionsService;

  /**
   * beforeEach - Sets up the testing module before each test case.
   * Input: None
   * Output: Initializes the RevisionsService instance available to all tests.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevisionsService],
    }).compile();

    service = module.get<RevisionsService>(RevisionsService);
  });

  /**
   * should be defined - Verifies that RevisionsService is correctly instantiated.
   * Input: None
   * Output: Passes if the service instance is defined (not null or undefined).
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
