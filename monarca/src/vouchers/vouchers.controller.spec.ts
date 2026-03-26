/**
 * FileName: vouchers.controller.spec
 * Description: Unit tests for VouchersController. Verifies that the controller
 * is correctly instantiated within a NestJS testing module.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { VouchersController } from './vouchers.controller';

describe('VouchersController', () => {
  let controller: VouchersController;

  /**
   * beforeEach - Sets up the testing module before each test case.
   * Input: None
   * Output: Initializes the VouchersController instance available to all tests.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VouchersController],
    }).compile();

    controller = module.get<VouchersController>(VouchersController);
  });

  /**
   * should be defined - Verifies that VouchersController is correctly instantiated.
   * Input: None
   * Output: Passes if the controller instance is defined (not null or undefined).
   */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
