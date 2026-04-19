/**
 * FileName: xml-parser.service.spec.ts
 * Description: Unit tests for XmlParserService. Validates correct parsing of
 *              CFDI 4.0 XML files and error handling for malformed inputs.
 *              Scoped to ST-3 fields only (class and tax_type removed).
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 19/04/2026 – Removed class and tax_type assertions (ST-4 scope). ST-3 cleanup.
 */

import { BadRequestException } from '@nestjs/common';
import { XmlParserService } from '../xml-parser.service';
import * as fs from 'fs';
import * as path from 'path';

describe('XmlParserService', () => {
  let service: XmlParserService;

  beforeEach(() => {
    service = new XmlParserService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parse() – valid CFDI 4.0', () => {
    const xmlPath = path.join(__dirname, 'sample-cfdi-4.0.xml');
    const xmlBuffer = fs.readFileSync(xmlPath);

    it('should extract the fiscal UUID', () => {
      const result = service.parse(xmlBuffer);
      expect(result.fiscal_uuid).toBe('6F29A520-4C2A-4D3B-9E1F-8A7B6C5D4E3F');
    });

    it('should detect CFDI version 4.0', () => {
      const result = service.parse(xmlBuffer);
      expect(result.cfdi_version).toBe('4.0');
    });

    it('should extract issuer RFC and name', () => {
      const result = service.parse(xmlBuffer);
      expect(result.issuer_rfc).toBe('AAA010101AAA');
      expect(result.issuer_name).toBe('Empresa Ejemplo S.A. de C.V.');
    });

    it('should extract receiver RFC and name', () => {
      const result = service.parse(xmlBuffer);
      expect(result.receiver_rfc).toBe('BBB020202BBB');
      expect(result.receiver_name).toBe('Ditta Consulting S.A. de C.V.');
    });

    it('should extract monetary amounts', () => {
      const result = service.parse(xmlBuffer);
      expect(result.subtotal).toBe(1000);
      expect(result.amount).toBe(1160);
      expect(result.currency).toBe('MXN');
      expect(result.exchange_rate).toBe(1);
    });

    it('should sum transferred taxes', () => {
      const result = service.parse(xmlBuffer);
      expect(result.tax_amount).toBe(160);
    });

    it('should set retention to 0 when no retentions exist', () => {
      const result = service.parse(xmlBuffer);
      expect(result.retention_amount).toBe(0);
    });

    it('should extract the invoice date', () => {
      const result = service.parse(xmlBuffer);
      expect(result.date).toBe('2026-04-10T14:30:00');
    });
  });

  describe('parse() – error handling', () => {
    it('should throw on invalid XML', () => {
      const badBuffer = Buffer.from('not xml at all <<<>>>', 'utf-8');
      expect(() => service.parse(badBuffer)).toThrow(BadRequestException);
    });

    it('should throw when Comprobante is missing', () => {
      const noComprobante = Buffer.from(
        '<?xml version="1.0"?><root><child/></root>',
        'utf-8',
      );
      expect(() => service.parse(noComprobante)).toThrow(BadRequestException);
    });

    it('should throw on unsupported CFDI version', () => {
      const badVersion = Buffer.from(
        '<?xml version="1.0"?><Comprobante Version="2.0"><Complemento><TimbreFiscalDigital UUID="test"/></Complemento></Comprobante>',
        'utf-8',
      );
      expect(() => service.parse(badVersion)).toThrow(BadRequestException);
    });
  });
});
