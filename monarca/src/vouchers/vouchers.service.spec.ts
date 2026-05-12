/**
 * FileName: vouchers.service.spec
 * Description: Unit tests for VouchersService. Verifies the service is correctly
 *              instantiated and that the CFDI cross-check on createFromUpload()
 *              rejects canceled invoices, missing invoices, and refund amounts
 *              that do not match the CFDI total (issue #69-child).
 * Authors: Original Moncarca team
 * Last Modification made:
 * 25/02/2026 [Diego de la Vega] Added detailed comments and documentation for clarity and maintainability.
 * 20/04/2026 [fest] Added mocked TypeORM repositories for isolated unit testing.
 * 05/05/2026 [Juan Pablo Narchi] Added CFDI cross-check tests for refund amount,
 *                                canceled CFDI, and not-found CFDI scenarios.
 * 11/05/2026 [Juan Pablo Narchi] Updated tests to use create(xmlBuffer, fileUrls)
 *                                signature merged from feature/voucher-db-insertion.
 */

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VouchersService } from 'src/vouchers/vouchers.service';
import { Voucher } from 'src/vouchers/entities/vouchers.entity';
import { Request } from 'src/requests/entities/request.entity';
import { CfdiValidationService } from 'src/vouchers/services/cfdi-validation.service';
import { XmlParserService } from 'src/vouchers/services/xml-parser.service';
import { ParsedCfdiVoucher } from 'src/vouchers/vouchers.service';
import { CreateVoucherDto } from 'src/vouchers/dto/create-voucher-dto';

describe('VouchersService', () => {
  let service: VouchersService;

  const voucherRepositoryMock = {
    create: jest.fn((entity) => entity),
    save: jest.fn(async (entity) => ({ id: 'voucher-1', ...entity })),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const requestRepositoryMock = {
    findOne: jest.fn(),
  };

  const dataSourceMock = {
    query: jest.fn(),
  };

  const cfdiValidationServiceMock = {
    resolveStatus: jest.fn(),
  };

  const xmlParserServiceMock = {
    parse: jest.fn(),
  };

  const FAKE_XML_BUFFER = Buffer.from('<fake-xml />');

  const buildParsedCfdi = (overrides: Partial<ParsedCfdiVoucher> = {}): ParsedCfdiVoucher => ({
    cfdi_version: '4.0',
    fiscal_uuid: '6F29A520-4C2A-4D3B-9E1F-8A7B6C5D4E3F',
    issuer_rfc: 'AAA010101AAA',
    issuer_name: 'Empresa Ejemplo SA de CV',
    receiver_rfc: 'BBB020202BBB',
    receiver_name: 'Cliente Ejemplo SA de CV',
    subtotal: 1000,
    amount: 1160,
    currency: 'MXN',
    exchange_rate: 1,
    discount: 0,
    iva_trasladado: 160,
    ieps_trasladado: 0,
    isr_retenido: 0,
    iva_retenido: 0,
    payment_form: '01',
    payment_method: 'PUE',
    date: '2026-04-25T00:00:00.000Z',
    ...overrides,
  });

  const buildDto = (overrides: Partial<CreateVoucherDto> = {}): CreateVoucherDto => ({
    id_request: 'request-1',
    class: 'GAS Gasolina',
    amount: 1160,
    tax_type: '16%',
    currency: 'MXN',
    date: '2026-04-25T00:00:00.000Z',
    status: 'pending',
    id_approver: 'approver-1',
    ...overrides,
  } as CreateVoucherDto);

  beforeEach(async () => {
    jest.clearAllMocks();

    requestRepositoryMock.findOne.mockResolvedValue({
      id: 'request-1',
      id_user: 'user-1',
      id_admin: 'approver-1',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VouchersService,
        { provide: getRepositoryToken(Voucher), useValue: voucherRepositoryMock },
        { provide: getRepositoryToken(Request), useValue: requestRepositoryMock },
        { provide: DataSource, useValue: dataSourceMock },
        { provide: CfdiValidationService, useValue: cfdiValidationServiceMock },
        { provide: XmlParserService, useValue: xmlParserServiceMock },
      ],
    }).compile();

    service = module.get<VouchersService>(VouchersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('CFDI cross-check on createFromUpload()', () => {
    it('persists the voucher with cfdi_status=VALID when amount matches the CFDI total', async () => {
      const parsed = buildParsedCfdi();
      xmlParserServiceMock.parse.mockReturnValue(parsed);
      cfdiValidationServiceMock.resolveStatus.mockResolvedValue('VALID');

      const saved = await service.create('user-1', buildDto(), FAKE_XML_BUFFER);

      expect(xmlParserServiceMock.parse).toHaveBeenCalledWith(FAKE_XML_BUFFER);
      expect(cfdiValidationServiceMock.resolveStatus).toHaveBeenCalledWith({
        fiscal_uuid: parsed.fiscal_uuid,
        issuer_rfc: parsed.issuer_rfc,
        receiver_rfc: parsed.receiver_rfc,
        amount: parsed.amount,
      });
      expect(voucherRepositoryMock.save).toHaveBeenCalledTimes(1);
      expect(saved.cfdi_status).toBe('VALID');
      expect(saved.fiscal_uuid).toBe(parsed.fiscal_uuid);
    });

    it('rejects refund amounts that do not match the CFDI total', async () => {
      xmlParserServiceMock.parse.mockReturnValue(buildParsedCfdi({ amount: 1160 }));
      cfdiValidationServiceMock.resolveStatus.mockResolvedValue('VALID');

      await expect(
        service.create('user-1', buildDto({ amount: 1500 }), FAKE_XML_BUFFER),
      ).rejects.toMatchObject({
        response: { code: 'VOUCHERS_AMOUNT_MISMATCH' },
      });
      expect(voucherRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('rejects vouchers whose CFDI is canceled at SAT', async () => {
      xmlParserServiceMock.parse.mockReturnValue(buildParsedCfdi());
      cfdiValidationServiceMock.resolveStatus.mockResolvedValue('CANCELED');

      await expect(
        service.create('user-1', buildDto(), FAKE_XML_BUFFER),
      ).rejects.toMatchObject({
        response: { code: 'VOUCHERS_CFDI_CANCELED' },
      });
      expect(voucherRepositoryMock.save).not.toHaveBeenCalled();
    });

    it('rejects vouchers whose CFDI is not found at SAT', async () => {
      xmlParserServiceMock.parse.mockReturnValue(buildParsedCfdi());
      cfdiValidationServiceMock.resolveStatus.mockResolvedValue('NOT_FOUND');

      await expect(
        service.create('user-1', buildDto(), FAKE_XML_BUFFER),
      ).rejects.toMatchObject({
        response: { code: 'VOUCHERS_CFDI_NOT_FOUND' },
      });
    });

    it('rejects vouchers whose currency mismatches the CFDI currency', async () => {
      xmlParserServiceMock.parse.mockReturnValue(
        buildParsedCfdi({ currency: 'USD', exchange_rate: 17.5 }),
      );
      cfdiValidationServiceMock.resolveStatus.mockResolvedValue('VALID');

      await expect(
        service.create('user-1', buildDto({ currency: 'MXN' }), FAKE_XML_BUFFER),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('skips the cross-check when no XML is uploaded', async () => {
      const saved = await service.create('user-1', buildDto());

      expect(xmlParserServiceMock.parse).not.toHaveBeenCalled();
      expect(cfdiValidationServiceMock.resolveStatus).not.toHaveBeenCalled();
      expect(saved.cfdi_status).toBeNull();
    });
  });
});
