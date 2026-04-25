/**
 * FileName: xml-parser.service.ts
 * Description: Service that parses Mexican CFDI XML files (versions 3.3 and 4.0),
 *              validates fiscal consistency, and normalizes output to a structure
 *              compatible with CreateVoucherDto.
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 23/04/2026 – Added ST-5 normalization integrated after ST-4 validation.
 * 20/04/2026 – Extracted detailed CFDI fiscal fields for voucher integration.
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import { ParsedCfdi } from '../interfaces/parsed-cfdi.interface';
import { CreateVoucherDto } from '../dto/create-voucher-dto';

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
   *         normalized fiscal fields compatible with CreateVoucherDto.
   */
  parse(
    xmlBuffer: Buffer,
  ): Partial<CreateVoucherDto> & Pick<ParsedCfdi, 'cfdi_version'> {
    let parsed: Record<string, any>;

    // Step 1 – Parse XML
    try {
      parsed = this.parser.parse(xmlBuffer.toString('utf-8'));
    } catch {
      throw new BadRequestException(
        'The uploaded file is not valid XML. Please verify the file and try again.',
      );
    }

    // Step 2 – Locate Comprobante root
    const comprobante = parsed?.Comprobante;
    if (!comprobante) {
      throw new BadRequestException(
        'The XML does not contain a valid CFDI Comprobante root element.',
      );
    }

    // Step 3 – Detect version
    const cfdiVersion = this.detectVersion(comprobante);

    // Step 4/5 – Extract, validate and normalize
    try {
      const extracted = this.mapComprobante(comprobante, cfdiVersion);
      this.validateFiscalConsistency(extracted);
      return {
        ...this.normalize(extracted),
        cfdi_version: extracted.cfdi_version,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to extract fiscal data from XML: ${message}`,
      );
    }
  }

  /**
   * normalize - Converts ParsedCfdi fields into business-friendly values
   *             compatible with CreateVoucherDto.
   */
  normalize(data: ParsedCfdi): Partial<CreateVoucherDto> {
    const currency = (data.currency || 'MXN').toUpperCase();

    return {
      amount: this.roundTo(data.amount, 2),
      currency,
      date: this.toIsoDateString(data.date),

      fiscal_uuid: data.fiscal_uuid,
      issuer_rfc: data.issuer_rfc,
      issuer_name: data.issuer_name,
      receiver_rfc: data.receiver_rfc,
      receiver_name: data.receiver_name,

      subtotal: this.roundTo(data.subtotal, 2),
      discount: this.roundOptional(data.discount, 2),
      iva_trasladado: this.roundOptional(data.iva_trasladado, 2),
      ieps_trasladado: this.roundOptional(data.ieps_trasladado, 2),
      isr_retenido: this.roundOptional(data.isr_retenido, 2),
      iva_retenido: this.roundOptional(data.iva_retenido, 2),

      exchange_rate:
        currency === 'MXN'
          ? this.roundTo(1, 4)
          : this.roundOptional(data.exchange_rate, 4),

      payment_form: data.payment_form,
      payment_method: data.payment_method,
    };
  }

  // ──────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────

  private detectVersion(comprobante: Record<string, any>): string {
    const version = comprobante['@_Version'] || comprobante['@_version'];
    if (!version || !['3.3', '4.0'].includes(version)) {
      throw new BadRequestException(
        `Unsupported CFDI version "${version}". Only 3.3 and 4.0 are supported.`,
      );
    }
    return version;
  }

  private mapComprobante(
    comprobante: Record<string, any>,
    cfdiVersion: string,
  ): ParsedCfdi {
    const emisor = this.getNode(comprobante, 'Emisor');
    const receptor = this.getNode(comprobante, 'Receptor');

    const fiscalUuid = this.extractFiscalUuid(comprobante);

    const {
      ivaTrasladado,
      iepsTrasladado,
      isrRetenido,
      ivaRetenido,
    } = this.extractTaxes(comprobante);

    const exchangeRate = this.parseNumber(
      this.getAttribute(comprobante, 'TipoCambio'),
    );

    const discount = this.parseNumber(
      this.getAttribute(comprobante, 'Descuento'),
    );

    const paymentForm = this.getAttribute(comprobante, 'FormaPago') || undefined;
    const paymentMethod =
      this.getAttribute(comprobante, 'MetodoPago') || undefined;

    const rawDate = this.getAttribute(comprobante, 'Fecha') || '';
    const isoDate = rawDate.includes('T') ? rawDate : `${rawDate}T00:00:00`;

    return {
      cfdi_version: cfdiVersion,
      fiscal_uuid: fiscalUuid,
      issuer_rfc: this.getAttribute(emisor, 'Rfc') || '',
      issuer_name: this.getAttribute(emisor, 'Nombre') || '',
      receiver_rfc: this.getAttribute(receptor, 'Rfc') || '',
      receiver_name: this.getAttribute(receptor, 'Nombre') || undefined,
      subtotal: this.parseNumber(this.getAttribute(comprobante, 'SubTotal')) || 0,
      amount: this.parseNumber(this.getAttribute(comprobante, 'Total')) || 0,
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

  private getNode(source: Record<string, any>, key: string): Record<string, any> {
    return (
      source[key] ||
      source[`cfdi:${key}`] ||
      source[`tfd:${key}`] ||
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

  private roundTo(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  private roundOptional(value: number | undefined, decimals: number): number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    return this.roundTo(value, decimals);
  }

  private toIsoDateString(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toISOString();
  }

  private extractFiscalUuid(comprobante: Record<string, any>): string {
    const complemento = comprobante.Complemento;
    if (!complemento) {
      throw new Error('CFDI is missing the Complemento node.');
    }

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
