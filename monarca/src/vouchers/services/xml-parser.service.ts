/**
 * FileName: xml-parser.service.ts
 * Description: Service that parses Mexican CFDI XML files (versions 3.3 and 4.0)
 *              using fast-xml-parser and maps the raw fiscal data into a ParsedCfdi
 *              object. Scoped to ST-3: structural validation and data extraction only.
 *              Classification (ST-4) and DB persistence (ST-6) are out of scope.
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 22/04/2026 – Added ST-4 fiscal consistency validations.
 * 20/04/2026 – Extracted detailed CFDI fiscal fields for voucher integration.
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
      const result = this.mapComprobante(comprobante, cfdiVersion);
      this.validateFiscalConsistency(result);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to extract fiscal data from XML: ${message}`,
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
    const emisor = this.getNode(comprobante, 'Emisor');
    const receptor = this.getNode(comprobante, 'Receptor');

    // Complemento → TimbreFiscalDigital (UUID)
    const fiscalUuid = this.extractFiscalUuid(comprobante);

    // Impuestos – detailed fiscal breakdown by SAT code
    const {
      ivaTrasladado,
      iepsTrasladado,
      isrRetenido,
      ivaRetenido,
    } = this.extractTaxes(comprobante);

    // Tipo de cambio (defaults to 1 for MXN invoices)
    const exchangeRate = this.parseNumber(
      this.getAttribute(comprobante, 'TipoCambio'),
    );

    const discount = this.parseNumber(
      this.getAttribute(comprobante, 'Descuento'),
    );

    const paymentForm = this.getAttribute(comprobante, 'FormaPago') || undefined;
    const paymentMethod =
      this.getAttribute(comprobante, 'MetodoPago') || undefined;

    // Date – CFDI uses "2024-01-15T12:30:00" without timezone suffix
    const rawDate = this.getAttribute(comprobante, 'Fecha') || '';
    const isoDate = rawDate
      ? (rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`)
      : '';

    return {
      cfdi_version: cfdiVersion,
      fiscal_uuid: fiscalUuid,
      issuer_rfc: this.getAttribute(emisor, 'Rfc') || '',
      issuer_name: this.getAttribute(emisor, 'Nombre') || '',
      receiver_rfc: this.getAttribute(receptor, 'Rfc') || '',
      receiver_name: this.getAttribute(receptor, 'Nombre') || undefined,
      subtotal: this.parseNumber(this.getAttribute(comprobante, 'SubTotal')) || 0,
      amount: this.parseNumber(this.getAttribute(comprobante, 'Total')) ?? Number.NaN,
      currency: this.getAttribute(comprobante, 'Moneda') || 'MXN',
      exchange_rate: exchangeRate,
      discount,
      iva_trasladado: ivaTrasladado,
      ieps_trasladado: iepsTrasladado,
      isr_retenido: isrRetenido,
      iva_retenido: ivaRetenido,
      payment_form: paymentForm,
      payment_method: paymentMethod,
      date: isoDate,
    };
  }

  private validateFiscalConsistency(data: ParsedCfdi): void {
    const requiredFields: Array<{ key: string; value: unknown }> = [
      { key: 'fiscal_uuid', value: data.fiscal_uuid },
      { key: 'issuer_rfc', value: data.issuer_rfc },
      { key: 'receiver_rfc', value: data.receiver_rfc },
      { key: 'amount', value: data.amount },
      { key: 'date', value: data.date },
    ];

    for (const field of requiredFields) {
      const isMissingString =
        typeof field.value === 'string' && field.value.trim().length === 0;
      const isMissingNumber =
        typeof field.value === 'number' && !Number.isFinite(field.value);
      const isMissing =
        field.value === null || field.value === undefined || isMissingString || isMissingNumber;

      if (isMissing) {
        throw new BadRequestException(
          `Required fiscal field "${field.key}" is missing in the XML invoice.`,
        );
      }
    }

    const issuerLength = data.issuer_rfc.trim().length;
    const receiverLength = data.receiver_rfc.trim().length;
    if (![12, 13].includes(issuerLength)) {
      throw new BadRequestException(
        'The issuer RFC must be 12 or 13 characters long.',
      );
    }
    if (![12, 13].includes(receiverLength)) {
      throw new BadRequestException(
        'The receiver RFC must be 12 or 13 characters long.',
      );
    }

    const amount = data.amount;
    const subtotal = data.subtotal || 0;
    const discount = data.discount || 0;
    const ivaTrasladado = data.iva_trasladado || 0;
    const iepsTrasladado = data.ieps_trasladado || 0;
    const isrRetenido = data.isr_retenido || 0;
    const ivaRetenido = data.iva_retenido || 0;

    const transferredTaxes = ivaTrasladado + iepsTrasladado;
    const retainedTaxes = isrRetenido + ivaRetenido;
    const expectedTotal = subtotal - discount + transferredTaxes - retainedTaxes;
    const tolerance = 0.1;

    if (Math.abs(expectedTotal - amount) > tolerance) {
      throw new BadRequestException(
        'The invoice total does not match the sum of subtotal and taxes.',
      );
    }

    const currency = (data.currency || '').toUpperCase();
    const exchangeRate = data.exchange_rate;

    if (currency !== 'MXN') {
      if (
        exchangeRate === undefined ||
        exchangeRate === null ||
        !Number.isFinite(exchangeRate) ||
        exchangeRate <= 1
      ) {
        throw new BadRequestException(
          'A valid exchange rate greater than 1 is required for non-MXN invoices.',
        );
      }
    } else if (
      exchangeRate !== undefined &&
      exchangeRate !== null &&
      exchangeRate !== 1
    ) {
      throw new BadRequestException(
        'For MXN invoices, the exchange rate must be 1 or omitted.',
      );
    }

    const nonNegativeFields: Array<{ label: string; value: number }> = [
      { label: 'amount', value: amount },
      { label: 'subtotal', value: subtotal },
      { label: 'discount', value: discount },
      { label: 'iva_trasladado', value: ivaTrasladado },
      { label: 'ieps_trasladado', value: iepsTrasladado },
      { label: 'isr_retenido', value: isrRetenido },
      { label: 'iva_retenido', value: ivaRetenido },
    ];

    for (const field of nonNegativeFields) {
      if (field.value < 0) {
        throw new BadRequestException(
          `The field "${field.label}" cannot be negative.`,
        );
      }
    }
  }

  private getNode(comprobante: Record<string, any>, key: string): Record<string, any> {
    return (
      comprobante[key] ||
      comprobante[`cfdi:${key}`] ||
      comprobante[`tfd:${key}`] ||
      {}
    );
  }

  private getAttribute(
    node: Record<string, any>,
    attribute: string,
  ): string | undefined {
    return (
      node[`@_${attribute}`] ??
      node[`@_${attribute.toLowerCase()}`] ??
      node[attribute] ??
      node[`cfdi:${attribute}`] ??
      node[`tfd:${attribute}`]
    );
  }

  private parseNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    const parsed = typeof value === 'number' ? value : parseFloat(String(value));
    return Number.isNaN(parsed) ? undefined : parsed;
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
      complemento['tfd:TimbreFiscalDigital'] ||
      complemento['cfdi:TimbreFiscalDigital'];

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
   *                Impuestos node using SAT tax codes.
   * Input: comprobante (Record<string, any>) – parsed Comprobante node.
   * Output: detailed fiscal breakdown by tax code.
   */
  private extractTaxes(comprobante: Record<string, any>): {
    ivaTrasladado: number;
    iepsTrasladado: number;
    isrRetenido: number;
    ivaRetenido: number;
  } {
    const impuestos = this.getNode(comprobante, 'Impuestos');
    let ivaTrasladado = 0;
    let iepsTrasladado = 0;
    let isrRetenido = 0;
    let ivaRetenido = 0;

    // ── Traslados (transferred taxes: IVA, IEPS) ──
    const traslados = this.getNode(impuestos, 'Traslados').Traslado;
    if (traslados) {
      const trasladoList = Array.isArray(traslados) ? traslados : [traslados];
      for (const t of trasladoList) {
        const impuesto = this.getAttribute(t, 'Impuesto');
        const importe = this.parseNumber(this.getAttribute(t, 'Importe')) || 0;

        if (impuesto === '002') {
          ivaTrasladado += importe;
        }

        if (impuesto === '003') {
          iepsTrasladado += importe;
        }
      }
    }

    // ── Retenciones (retained taxes: ISR, retained IVA) ──
    const retenciones = this.getNode(impuestos, 'Retenciones').Retencion;
    if (retenciones) {
      const retencionList = Array.isArray(retenciones)
        ? retenciones
        : [retenciones];
      for (const r of retencionList) {
        const impuesto = this.getAttribute(r, 'Impuesto');
        const importe = this.parseNumber(this.getAttribute(r, 'Importe')) || 0;

        if (impuesto === '001') {
          isrRetenido += importe;
        }

        if (impuesto === '002') {
          ivaRetenido += importe;
        }
      }
    }

    return { ivaTrasladado, iepsTrasladado, isrRetenido, ivaRetenido };
  }
}
