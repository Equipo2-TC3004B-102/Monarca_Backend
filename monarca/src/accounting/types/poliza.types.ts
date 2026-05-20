/**
 * FileName: poliza.types.ts
 * Description: TypeScript interfaces that describe the JSON structure of an accounting
 *              poliza (AV or GV) as specified by Ditta. Mirrors the field names and
 *              types from the SAP FI import format.
 * Authors: DebugStudio Team
 * Last Modification made:
 * 20/05/2026 [Julio Rodriguez] Created types.
 */

export interface PolizaHeader {
  ID_VIAJE: string;
  DOC_TYPE: string;
  HEADER_TXT: string;
  COMP_CODE: string;
  PSTNG_DATE: string;
  CURRENCY: string;
  EXCH_RATE: number;
}

export interface PolizaLine {
  ITEMNO_ACC: number;
  SHKZG: 'S' | 'H';
  GL_ACCOUNT: string;
  COSTCENTER?: string;
  VENDOR_NO?: string;
  ITEM_TEXT: string;
  AMT_DOCCUR: number;
}

export interface Poliza {
  header: PolizaHeader;
  detail: PolizaLine[];
}

export interface PolizaOutput {
  polizas: Poliza[];
}
