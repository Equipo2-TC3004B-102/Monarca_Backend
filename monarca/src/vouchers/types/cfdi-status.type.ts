/**
 * FileName: cfdi-status.type.ts
 * Description: Type definition for CFDI status values used in voucher validation.
 * Authors: Original Monarca team
 * Last Modification made:
 * 17/05/2026 [Santiago Coronado Hernández and Juan Pablo Narchi] Created CfdiStatus type to represent possible validation states of CFDI vouchers based on SAT responses, enabling consistent status handling across the application.
 */

/**
 * CFDI Status type for vouchers.
 * Represents the validation status from SAT (Servicio de Administración Tributaria).
 *
 * - VALID: CFDI invoice is valid and recognized by SAT
 * - CANCELED: CFDI invoice has been canceled by the issuer
 * - NOT_FOUND: CFDI invoice does not exist in SAT database
 * - PENDING: CFDI validation is pending (not yet available from SAT)
 */
export type CfdiStatus = 'VALID' | 'CANCELED' | 'NOT_FOUND' | 'PENDING';
