/**
 * FileName: notifications.service.spec
 * Description: Unit tests for NotificationsService. Verifies that the service
 *              is correctly instantiated within a NestJS testing module.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  /**
   * beforeEach - Sets up the testing module before each test case.
   * Input: None
   * Output: Initializes the NotificationsService instance available to all tests.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  /**
   * should be defined - Verifies that NotificationsService is correctly instantiated.
   * Input: None
   * Output: Passes if the service instance is defined (not null or undefined).
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
