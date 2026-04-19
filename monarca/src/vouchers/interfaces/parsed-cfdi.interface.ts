/**
 * FileName: parsed-cfdi.interface.ts
 * Description: Interface representing the raw fiscal data extracted from a
 *              CFDI XML file (versions 3.3 and 4.0). Scoped to ST-3: only
 *              fields that are directly readable from the XML are included.
 *              Classification and business validations belong to future subtasks.
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 19/04/2026 – Removed class and tax_type (ST-4 scope). ST-3 cleanup.
 */

/**
 * Raw fiscal data extracted directly from a CFDI XML file.
 * Fields like id_request, status, and id_approver are NOT included because
 * they come from the application context, not from the invoice XML.
 * Fields like class (ClaveProdServ classification) and tax_type (human-readable
 * label) are NOT included because they require interpretation — that is ST-4 scope.
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

  /** Subtotal before taxes (@_SubTotal) */
  subtotal: number;

  /** Total amount (@_Total) */
  amount: number;

  /** ISO currency code (@_Moneda, e.g. MXN, USD) */
  currency: string;

  /** Exchange rate (@_TipoCambio); defaults to 1 when currency is MXN */
  exchange_rate: number;

  /** Sum of all Traslado/@_Importe values (IVA, IEPS) */
  tax_amount: number;

  /** Sum of all Retencion/@_Importe values (ISR, retained IVA) */
  retention_amount: number;

  /** Invoice date normalized to ISO 8601 string */
  date: string;
}
