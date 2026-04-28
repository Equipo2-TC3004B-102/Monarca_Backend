/**
 * FileName: parsed-cfdi.interface.ts
 * Description: Interface representing the raw fiscal data extracted from a
 *              CFDI XML file (versions 3.3 and 4.0). Scoped to ST-3: only
 *              fields that are directly readable from the XML are included.
 *              Classification and business validations belong to future subtasks.
 * Authors: Fausto Izquierdo
 * Last Modification made:
 * 20/04/2026 – Aligned with detailed CFDI fiscal fields for vouchers.
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
  receiver_name?: string;

  /** Subtotal before taxes (@_SubTotal) */
  subtotal: number;

  /** Total amount (@_Total) */
  amount: number;

  /** ISO currency code (@_Moneda, e.g. MXN, USD) */
  currency: string;

  /** Exchange rate (@_TipoCambio); defaults to 1 when currency is MXN */
  exchange_rate?: number;

  /** Discount amount (@_Descuento) */
  discount?: number;

  /** IVA trasladado amount from Traslado/@_Importe when Impuesto = 002 */
  iva_trasladado?: number;

  /** IEPS trasladado amount from Traslado/@_Importe when Impuesto = 003 */
  ieps_trasladado?: number;

  /** ISR retenido amount from Retencion/@_Importe when Impuesto = 001 */
  isr_retenido?: number;

  /** IVA retenido amount from Retencion/@_Importe when Impuesto = 002 */
  iva_retenido?: number;

  /** Forma de pago (@_FormaPago) */
  payment_form?: string;

  /** Método de pago (@_MetodoPago) */
  payment_method?: string;

  /** Invoice date normalized to ISO 8601 string */
  date: string;
}
