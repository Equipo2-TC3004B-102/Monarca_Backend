/**
 * FileName: vouchers.controller.spec
 * Description: Unit tests for VouchersController. Verifies that the controller
 * is correctly instantiated within a NestJS testing module.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 * 20/04/2026 [fest] Added service and guard dependency mocks for isolated unit testing.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { VouchersController } from 'src/vouchers/vouchers.controller';
import { VouchersService } from 'src/vouchers/vouchers.service';
import { XmlParserService } from 'src/vouchers/services/xml-parser.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permissions.guard';

describe('VouchersController', () => {
  let controller: VouchersController;

  const vouchersServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findByRequest: jest.fn(),
    update: jest.fn(),
    approve: jest.fn(),
    deny: jest.fn(),
  };

  const xmlParserServiceMock = {
    parse: jest.fn(),
  };

  const jwtServiceMock = {
    verifyAsync: jest.fn(),
  };

  const authGuardMock = {
    canActivate: jest.fn().mockResolvedValue(true),
  };

  const permissionsGuardMock = {
    canActivate: jest.fn().mockResolvedValue(true),
  };

  /**
   * beforeEach - Sets up the testing module before each test case.
   * Input: None
   * Output: Initializes the VouchersController instance available to all tests.
   */
  beforeEach(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [VouchersController],
      providers: [
        {
          provide: VouchersService,
          useValue: vouchersServiceMock,
        },
        {
          provide: XmlParserService,
          useValue: xmlParserServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(authGuardMock)
      .overrideGuard(PermissionsGuard)
      .useValue(permissionsGuardMock);

    const module: TestingModule = await moduleBuilder.compile();

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
