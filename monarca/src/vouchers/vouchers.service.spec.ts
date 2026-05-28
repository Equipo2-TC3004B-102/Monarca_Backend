/**
 * FileName: vouchers.service.spec
 * Description: Unit tests for VouchersService. Verifies that the service
 *              is correctly instantiated within a NestJS testing module.
 * Authors: Original Moncarca team
 * Last Modification made:
 * 17/05/2026 [Santiago Coronado Hernández and Juan Pablo Narchi] Added DataSource and CfdiValidationService mocks to the testing module setup, and implemented test cases for voucher creation with CFDI validation scenarios, including amount mismatch and canceled CFDI cases. 
 * Ensured comprehensive coverage of critical business logic in the create method of VouchersService.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VouchersService } from 'src/vouchers/vouchers.service';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { VoucherCreationLog } from 'src/vouchers/entities/voucher-creation-log.entity';
import { Request } from 'src/requests/entities/request.entity';
import { RequestsDestination } from 'src/requests/entities/requests-destination.entity';
import { DataSource } from 'typeorm';
import { CfdiValidationService } from 'src/vouchers/services/cfdi-validation.service';

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

  const logRepositoryMock = {
    create: jest.fn((value) => value),
    save: jest.fn().mockResolvedValue({}),
  };

  const requestsDestinationRepositoryMock = {
    findOne: jest.fn().mockResolvedValue(null),
  };

  const dataSourceMock = {
    query: jest.fn(),
  };

  const cfdiValidationServiceMock = {
    validateSatStatus: jest.fn().mockResolvedValue('VALID'),
  };

  /**
   * beforeEach - Sets up the testing module before each test case.
   * Input: None
   * Output: Initializes the VouchersService instance available to all tests.
   */
  beforeEach(async () => {
    voucherRepositoryMock.create.mockImplementation((value) => value);
    voucherRepositoryMock.save.mockImplementation(async (value) => value);
    voucherRepositoryMock.find.mockResolvedValue([]);
    voucherRepositoryMock.findOne.mockResolvedValue(null);
    voucherRepositoryMock.update.mockResolvedValue({ affected: 1 });
    voucherRepositoryMock.delete.mockResolvedValue({ affected: 1 });

    requestRepositoryMock.findOne.mockResolvedValue({
      id: 'request-1',
      id_user: 'user-1',
      id_admin: 'admin-1',
    });

    dataSourceMock.query.mockResolvedValue([]);
    cfdiValidationServiceMock.validateSatStatus.mockResolvedValue('VALID');

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
        {
          provide: getRepositoryToken(VoucherCreationLog),
          useValue: logRepositoryMock,
        },
        {
          provide: getRepositoryToken(RequestsDestination),
          useValue: requestsDestinationRepositoryMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
        {
          provide: CfdiValidationService,
          useValue: cfdiValidationServiceMock,
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

  it('creates a voucher and stores VALID CFDI status when cross-check passes', async () => {
    const voucher = await service.create('user-1', {
      id_request: 'request-1',
      class: 'GAS Gasolina',
      amount: 150,
      tax_type: '15%',
      currency: 'MXN',
      date: '2026-05-17T00:00:00.000Z',
      status: 'voucher uploaded',
      id_approver: 'admin-1',
    }, {
      fiscal_uuid: '6F29A520-4C2A-4D3B-9E1F-8A7B6C5D4E3F',
      currency: 'MXN',
      amount: 150,
      issuer_rfc: 'AAA010101AAA',
      issuer_name: 'Empresa Ejemplo SA de CV',
      receiver_rfc: 'BBB020202BBB',
      subtotal: 150,
      payment_form: '01',
      payment_method: 'PUE',
    });

    expect(voucher.cfdi_status).toBe('VALID');
    expect(voucher.fiscal_uuid).toBe('6F29A520-4C2A-4D3B-9E1F-8A7B6C5D4E3F');
    expect(cfdiValidationServiceMock.validateSatStatus).toHaveBeenCalledWith(
      '6F29A520-4C2A-4D3B-9E1F-8A7B6C5D4E3F',
    );
  });

  it('rejects vouchers when the CFDI amount differs beyond tolerance', async () => {
    await expect(
      service.create('user-1', {
        id_request: 'request-1',
        class: 'GAS Gasolina',
        amount: 150,
        tax_type: '15%',
        currency: 'MXN',
        date: '2026-05-17T00:00:00.000Z',
        status: 'voucher uploaded',
        id_approver: 'admin-1',
      }, {
        fiscal_uuid: '6F29A520-4C2A-4D3B-9E1F-8A7B6C5D4E3F',
        currency: 'MXN',
        amount: 151,
      }),
    ).rejects.toMatchObject({
      response: { code: 'VOUCHERS_AMOUNT_MISMATCH' },
    });
  });

  it('rejects vouchers when SAT reports the CFDI as canceled', async () => {
    cfdiValidationServiceMock.validateSatStatus.mockResolvedValue('CANCELED');

    await expect(
      service.create('user-1', {
        id_request: 'request-1',
        class: 'GAS Gasolina',
        amount: 150,
        tax_type: '15%',
        currency: 'MXN',
        date: '2026-05-17T00:00:00.000Z',
        status: 'voucher uploaded',
        id_approver: 'admin-1',
      }, {
        fiscal_uuid: '6F29A520-4C2A-4D3B-9E1F-8A7B6C5D4E3F',
        currency: 'MXN',
        amount: 150,
      }),
    ).rejects.toMatchObject({
      response: { code: 'VOUCHERS_CFDI_CANCELED' },
    });
  });

  describe('voucher time limit validation', () => {
    const DAY_MS = 24 * 60 * 60 * 1000;

    const baseDto = {
      id_request: 'request-1',
      class: 'GAS Gasolina',
      amount: 150,
      tax_type: '15%',
      currency: 'MXN',
      status: 'voucher uploaded',
      id_approver: 'admin-1',
    };

    const mockDestinations = (departureDate: Date, arrivalDate: Date) => {
      requestsDestinationRepositoryMock.findOne
        .mockResolvedValueOnce({ departure_date: departureDate })
        .mockResolvedValueOnce({ arrival_date: arrivalDate });
    };

    it('rejects when the voucher date is before the trip start date', async () => {
      const tripStart = new Date(Date.now() + 1 * DAY_MS);
      const tripEnd = new Date(Date.now() + 3 * DAY_MS);
      const voucherDate = new Date(Date.now() - 1 * DAY_MS);
      mockDestinations(tripStart, tripEnd);

      await expect(
        service.create('user-1', { ...baseDto, date: voucherDate.toISOString() }),
      ).rejects.toThrow('Voucher date cannot be before the trip start date');
    });

    it('rejects when the voucher date is after the trip end date', async () => {
      const tripStart = new Date(Date.now() - 5 * DAY_MS);
      const tripEnd = new Date(Date.now() - 2 * DAY_MS);
      const voucherDate = new Date(Date.now() - 1 * DAY_MS);
      mockDestinations(tripStart, tripEnd);

      await expect(
        service.create('user-1', { ...baseDto, date: voucherDate.toISOString() }),
      ).rejects.toThrow('Voucher date cannot be after the trip end date');
    });

    it('rejects when submitted before the trip has started', async () => {
      const tripStart = new Date(Date.now() + 2 * DAY_MS);
      const tripEnd = new Date(Date.now() + 5 * DAY_MS);
      const voucherDate = new Date(Date.now() + 3 * DAY_MS);
      mockDestinations(tripStart, tripEnd);

      await expect(
        service.create('user-1', { ...baseDto, date: voucherDate.toISOString() }),
      ).rejects.toThrow('Vouchers cannot be submitted before the trip has started');
    });

    it('rejects when submitted after the 7-day deadline', async () => {
      const tripStart = new Date(Date.now() - 15 * DAY_MS);
      const tripEnd = new Date(Date.now() - 10 * DAY_MS);
      const voucherDate = new Date(Date.now() - 12 * DAY_MS);
      mockDestinations(tripStart, tripEnd);

      await expect(
        service.create('user-1', { ...baseDto, date: voucherDate.toISOString() }),
      ).rejects.toThrow('Vouchers can only be submitted within 7 days after the trip ends');
    });

    it('allows creation when all time conditions are valid', async () => {
      const tripStart = new Date(Date.now() - 5 * DAY_MS);
      const tripEnd = new Date(Date.now() - 2 * DAY_MS);
      const voucherDate = new Date(Date.now() - 3 * DAY_MS);
      mockDestinations(tripStart, tripEnd);

      await expect(
        service.create('user-1', { ...baseDto, date: voucherDate.toISOString() }),
      ).resolves.toBeDefined();
    });
  });
});
