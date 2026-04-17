/**
 * FileName: xml-parser.service.ts
 * Description: Service that parses Mexican CFDI XML files (versions 3.3 and 4.0)
 *              using fast-xml-parser and maps the fiscal data into a ParsedCfdi
 *              object compatible with CreateVoucherDto.
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 17/04/2026 – Initial creation for Task 10 (ST-3).
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { ParsedCfdi } from '../interfaces/parsed-cfdi.interface';

@Injectable()
export class XmlParserService {
  private readonly parser: XMLParser;

  constructor() {
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      // Remove namespace prefixes so cfdi:Comprobante becomes Comprobante
      removeNSPrefix: true,
    });
  }

  // ──────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────

  /**
   * parse - Receives the raw XML buffer, validates it as a CFDI, and returns
   *         the extracted fiscal fields.
   * Input: xmlBuffer (Buffer) – raw bytes of the uploaded XML file.
   * Output: ParsedCfdi – object with all fiscal fields mapped to DTO properties.
   * Throws BadRequestException if the XML is malformed or not a valid CFDI.
   */
  parse(xmlBuffer: Buffer): ParsedCfdi {
    let parsed: Record<string, any>;

    // Step 1 – Parse the XML into a JS object
    try {
      parsed = this.parser.parse(xmlBuffer.toString('utf-8'));
    } catch (error) {
      throw new BadRequestException(
        'The uploaded file is not valid XML. Please verify the file and try again.',
      );
    }

    // Step 2 – Locate the root Comprobante node
    const comprobante = parsed?.Comprobante;
    if (!comprobante) {
      throw new BadRequestException(
        'The XML does not contain a valid CFDI Comprobante root element.',
      );
    }

    // Step 3 – Detect CFDI version
    const cfdiVersion = this.detectVersion(comprobante);

    // Step 4 – Extract all fiscal fields
    try {
      return this.mapComprobante(comprobante, cfdiVersion);
    } catch (error) {
      throw new BadRequestException(
        `Failed to extract fiscal data from XML: ${error.message}`,
      );
    }
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  /**
   * detectVersion - Reads the Version attribute from the Comprobante node.
   * Input: comprobante (Record<string, any>) – parsed Comprobante node.
   * Output: string – '3.3' or '4.0'.
   * Throws BadRequestException if version is not 3.3 or 4.0.
   */
  private detectVersion(comprobante: Record<string, any>): string {
    const version = comprobante['@_Version'] || comprobante['@_version'];
    if (!version || !['3.3', '4.0'].includes(version)) {
      throw new BadRequestException(
        `Unsupported CFDI version "${version}". Only 3.3 and 4.0 are supported.`,
      );
    }
    return version;
  }

  /**
   * mapComprobante - Maps all relevant CFDI attributes and child nodes into
   *                  a flat ParsedCfdi object.
   * Input: comprobante (Record<string, any>) – parsed Comprobante node;
   *        cfdiVersion (string) – '3.3' or '4.0'.
   * Output: ParsedCfdi – fully populated fiscal data object.
   */
  private mapComprobante(
    comprobante: Record<string, any>,
    cfdiVersion: string,
  ): ParsedCfdi {
    // Emisor & Receptor
    const emisor = comprobante.Emisor || {};
    const receptor = comprobante.Receptor || {};

    // Complemento → TimbreFiscalDigital (UUID)
    const fiscalUuid = this.extractFiscalUuid(comprobante);

    // Impuestos
    const { taxAmount, retentionAmount, taxTypeLabel } =
      this.extractTaxes(comprobante);

    // Tipo de cambio (defaults to 1 for MXN)
    const exchangeRate = parseFloat(comprobante['@_TipoCambio']) || 1;

    // ClaveProdServ from first Concepto for auto-classification
    const voucherClass = this.classifyByClaveProdServ(comprobante);

    // Date – CFDI uses format "2024-01-15T12:30:00" without timezone
    const rawDate = comprobante['@_Fecha'] || '';
    const isoDate = rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`;

    return {
      cfdi_version: cfdiVersion,
      fiscal_uuid: fiscalUuid,
      issuer_rfc: emisor['@_Rfc'] || '',
      issuer_name: emisor['@_Nombre'] || '',
      receiver_rfc: receptor['@_Rfc'] || '',
      receiver_name: receptor['@_Nombre'] || '',
      subtotal: parseFloat(comprobante['@_SubTotal']) || 0,
      amount: parseFloat(comprobante['@_Total']) || 0,
      currency: comprobante['@_Moneda'] || 'MXN',
      exchange_rate: exchangeRate,
      tax_amount: taxAmount,
      retention_amount: retentionAmount,
      date: isoDate,
      class: voucherClass,
      tax_type: taxTypeLabel,
    };
  }

  /**
   * extractFiscalUuid - Navigates the Complemento node to find the
   *                     TimbreFiscalDigital UUID.
   * Input: comprobante (Record<string, any>) – parsed Comprobante node.
   * Output: string – the 36-character fiscal UUID.
   * Throws Error if the UUID is not found.
   */
  private extractFiscalUuid(comprobante: Record<string, any>): string {
    const complemento = comprobante.Complemento;
    if (!complemento) {
      throw new Error('CFDI is missing the Complemento node.');
    }

    // TimbreFiscalDigital can be a direct child or within an array
    const timbre =
      complemento.TimbreFiscalDigital ||
      complemento['tfd:TimbreFiscalDigital'];

    if (!timbre) {
      throw new Error(
        'CFDI is missing the TimbreFiscalDigital node inside Complemento.',
      );
    }

    const uuid = timbre['@_UUID'];
    if (!uuid) {
      throw new Error('TimbreFiscalDigital is missing the UUID attribute.');
    }

    return uuid;
  }

  /**
   * extractTaxes - Sums all transferred and retained tax amounts from the
   *                Impuestos node. Also generates a human-readable tax label.
   * Input: comprobante (Record<string, any>) – parsed Comprobante node.
   * Output: { taxAmount, retentionAmount, taxTypeLabel }.
   */
  private extractTaxes(comprobante: Record<string, any>): {
    taxAmount: number;
    retentionAmount: number;
    taxTypeLabel: string;
  } {
    const impuestos = comprobante.Impuestos || {};
    let taxAmount = 0;
    let retentionAmount = 0;
    const taxTypes: string[] = [];

    // ── Traslados (transferred taxes: IVA, IEPS) ──
    const traslados = impuestos.Traslados?.Traslado;
    if (traslados) {
      const trasladoList = Array.isArray(traslados) ? traslados : [traslados];
      for (const t of trasladoList) {
        taxAmount += parseFloat(t['@_Importe']) || 0;

        // Build tax type label (e.g. "IVA 16%")
        const impuesto = t['@_Impuesto'];
        const tasa = t['@_TasaOCuota'];
        if (impuesto && tasa) {
          const taxName = this.getTaxName(impuesto);
          const percentage = (parseFloat(tasa) * 100).toFixed(0);
          taxTypes.push(`${taxName} ${percentage}%`);
        }
      }
    }

    // ── Retenciones (retained taxes: ISR, retained IVA) ──
    const retenciones = impuestos.Retenciones?.Retencion;
    if (retenciones) {
      const retencionList = Array.isArray(retenciones)
        ? retenciones
        : [retenciones];
      for (const r of retencionList) {
        retentionAmount += parseFloat(r['@_Importe']) || 0;
      }
    }

    // Deduplicate and join tax type labels
    const uniqueTaxTypes = [...new Set(taxTypes)];
    const taxTypeLabel =
      uniqueTaxTypes.length > 0 ? uniqueTaxTypes.join(', ') : 'N/A';

    return { taxAmount, retentionAmount, taxTypeLabel };
  }

  /**
   * getTaxName - Maps SAT tax codes (c_Impuesto) to human-readable names.
   * Input: code (string) – SAT tax code ('001', '002', '003').
   * Output: string – human-readable name.
   */
  private getTaxName(code: string): string {
    const taxNames: Record<string, string> = {
      '001': 'ISR',
      '002': 'IVA',
      '003': 'IEPS',
    };
    return taxNames[code] || code;
  }

  /**
   * classifyByClaveProdServ - Infers a voucher classification based on the
   *                           ClaveProdServ of the first concept in the XML.
   * Input: comprobante (Record<string, any>) – parsed Comprobante node.
   * Output: string – classification label (e.g. 'TRANSPORT', 'FOOD').
   *
   * SAT ClaveProdServ reference ranges:
   *   50 → Food & beverage
   *   78 → Transport & logistics
   *   90 → Travel / lodging services
   *   15 → Fuels & lubricants
   */
  private classifyByClaveProdServ(comprobante: Record<string, any>): string {
    const conceptos = comprobante.Conceptos?.Concepto;
    if (!conceptos) {
      return 'OTHER';
    }

    const firstConcepto = Array.isArray(conceptos) ? conceptos[0] : conceptos;
    const clave = String(firstConcepto['@_ClaveProdServ'] || '');

    if (clave.startsWith('50')) return 'FOOD';
    if (clave.startsWith('78')) return 'TRANSPORT';
    if (clave.startsWith('90')) return 'LODGING';
    if (clave.startsWith('15')) return 'GASOLINE';

    return 'OTHER';
  }
}
