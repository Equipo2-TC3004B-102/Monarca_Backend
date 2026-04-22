/**
 * FileName: xml-parser.service.spec.ts
 * Description: Unit tests for XmlParserService. Validates correct parsing of
 *              CFDI 4.0 XML files and error handling for malformed inputs.
 *              Scoped to ST-3 fields only (class and tax_type removed).
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 20/04/2026 – Updated assertions for detailed CFDI fiscal fields.
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

    it('should extract payment and exchange fields', () => {
      const result = service.parse(xmlBuffer);
      expect(result.exchange_rate).toBe(1);
      expect(result.discount).toBe(50);
      expect(result.payment_form).toBe('01');
      expect(result.payment_method).toBe('PUE');
    });

    it('should extract monetary amounts', () => {
      const result = service.parse(xmlBuffer);
      expect(result.subtotal).toBe(1000);
      expect(result.amount).toBe(1160);
      expect(result.currency).toBe('MXN');
    });

    it('should sum transferred taxes by SAT code', () => {
      const result = service.parse(xmlBuffer);
      expect(result.iva_trasladado).toBe(160);
      expect(result.ieps_trasladado).toBe(0);
    });

    it('should sum retained taxes by SAT code', () => {
      const result = service.parse(xmlBuffer);
      expect(result.isr_retenido).toBe(25);
      expect(result.iva_retenido).toBe(0);
    });

    it('should extract the invoice date', () => {
      const result = service.parse(xmlBuffer);
      expect(result.date).toBe('2026-04-10T14:30:00');
    });
  });

  describe('parse() – valid CFDI 3.3', () => {
    const xmlPath33 = path.join(__dirname, 'sample-cfdi-3.3.xml');
    const xmlBuffer33 = fs.readFileSync(xmlPath33);

    it('should detect CFDI version 3.3', () => {
      const result = service.parse(xmlBuffer33);
      expect(result.cfdi_version).toBe('3.3');
    });

    it('should extract the fiscal UUID', () => {
      const result = service.parse(xmlBuffer33);
      expect(result.fiscal_uuid).toBe('11112222-3333-4444-5555-666677778888');
    });

    it('should handle missing optional fields gracefully (like Receiver Name in 3.3)', () => {
      const result = service.parse(xmlBuffer33);
      expect(result.receiver_rfc).toBe('BBB020202BBB');
      expect(result.receiver_name).toBeUndefined(); // Should not crash
    });

    it('should parse exchange rates correctly with decimals', () => {
      const result = service.parse(xmlBuffer33);
      expect(result.currency).toBe('USD');
      expect(result.exchange_rate).toBe(19.5030);
    });

    it('should correctly sum transferred and retained taxes', () => {
      const result = service.parse(xmlBuffer33);
      expect(result.iva_trasladado).toBe(304);
      expect(result.isr_retenido).toBe(90);
      expect(result.ieps_trasladado).toBe(0); // Not present in the XML
      expect(result.iva_retenido).toBe(0); // Not present in the XML
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
