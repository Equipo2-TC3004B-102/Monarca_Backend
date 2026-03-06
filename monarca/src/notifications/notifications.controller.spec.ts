/**
 * FileName: notifications.controller.spec
 * Description: Unit tests for NotificationsController. Verifies that the controller
 *              is correctly instantiated within a NestJS testing module.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';

describe('NotificationsController', () => {
  let controller: NotificationsController;

  /**
   * beforeEach - Sets up the testing module before each test case.
   * Input: None
   * Output: Initializes the NotificationsController instance available to all tests.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  /**
   * should be defined - Verifies that NotificationsController is correctly instantiated.
   * Input: None
   * Output: Passes if the controller instance is defined (not null or undefined).
   */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
