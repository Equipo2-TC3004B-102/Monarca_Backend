/**
 * FileName: parsed-cfdi.interface.ts
 * Description: Interface representing the fiscal data extracted from a CFDI
 *              XML file (versions 3.3 and 4.0). Maps directly to the fiscal
 *              fields of CreateVoucherDto.
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 17/04/2026 – Initial creation for Task 10 (ST-3).
 */

/**
 * Partial shape of CreateVoucherDto populated exclusively from XML extraction.
 * Fields like id_request, status, and id_approver are NOT included because
 * they come from the application context, not from the invoice XML.
 */
export interface ParsedCfdi {
  /** CFDI version detected ('3.3' | '4.0') */
  cfdi_version: string;

  /** UUID del Timbre Fiscal Digital */
  fiscal_uuid: string;

  /** RFC del emisor */
  issuer_rfc: string;

  /** Razón social del emisor */
  issuer_name: string;

  /** RFC del receptor */
  receiver_rfc: string;

  /** Razón social del receptor */
  receiver_name: string;

  /** Subtotal before taxes */
  subtotal: number;

  /** Total amount (SubTotal + Taxes − Retentions) */
  amount: number;

  /** ISO currency code (e.g. MXN, USD) */
  currency: string;

  /** Exchange rate (TipoCambio); 1 when currency is MXN */
  exchange_rate: number;

  /** Sum of transferred taxes (IVA, IEPS) */
  tax_amount: number;

  /** Sum of retained taxes (ISR, retained IVA) */
  retention_amount: number;

  /** Invoice date as ISO 8601 string */
  date: string;

  /** Voucher classification inferred from ClaveProdServ */
  class: string;

  /** Tax type description (e.g. 'IVA 16%') */
  tax_type: string;
}
