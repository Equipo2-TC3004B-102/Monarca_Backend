/**
 * FileName: vouchers.service.spec
 * Description: Unit tests for VouchersService. Verifies that the service
 *              is correctly instantiated within a NestJS testing module.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 * 20/04/2026 [fest] Added mocked TypeORM repositories for isolated unit testing.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VouchersService } from 'src/vouchers/vouchers.service';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { Request } from 'src/requests/entities/request.entity';

describe('VouchersService', () => {
  let service: VouchersService;

  const voucherRepositoryMock = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const requestRepositoryMock = {
    findOne: jest.fn(),
  };

  /**
   * beforeEach - Sets up the testing module before each test case.
   * Input: None
   * Output: Initializes the VouchersService instance available to all tests.
   */
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VouchersService,
        {
          provide: getRepositoryToken(Voucher),
          useValue: voucherRepositoryMock,
        },
        {
          provide: getRepositoryToken(Request),
          useValue: requestRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<VouchersService>(VouchersService);
  });

  /**
   * should be defined - Verifies that VouchersService is correctly instantiated.
   * Input: None
   * Output: Passes if the service instance is defined (not null or undefined).
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
