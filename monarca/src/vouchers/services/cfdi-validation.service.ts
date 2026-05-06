/**
 * FileName: cfdi-validation.service.ts
 * Description: Service that resolves the SAT validation status of a CFDI invoice
 *              identified by fiscal UUID, issuer RFC, receiver RFC and total
 *              amount. The official SAT consulta endpoint is documented but a
 *              live integration requires production credentials and a SOAP
 *              client; this implementation exposes a clean async contract and
 *              returns VALID by default so the cross-check pipeline can run end
 *              to end. The behaviour can be tuned via the CFDI_VALIDATION_MODE
 *              env variable (valid | canceled | not_found) for testing, and the
 *              real SAT call can be plugged into resolveStatus() later without
 *              touching the consumers.
 * Authors: Juan Pablo Narchi
 * Last Modification made:
 * 05/05/2026 [Juan Pablo Narchi] Created CFDI validation service stub for issue #69-child.
 */

import { Injectable } from '@nestjs/common';
import { CfdiStatus } from '../entities/vouchers.entity';

export interface CfdiValidationQuery {
  fiscal_uuid: string;
  issuer_rfc: string;
  receiver_rfc: string;
  amount: number;
}

@Injectable()
export class CfdiValidationService {
  /**
   * resolveStatus - Returns the SAT validation status for a CFDI invoice.
   * Defaults to VALID; the CFDI_VALIDATION_MODE env variable can override the
   * outcome for local testing (canceled | not_found | valid). The real SAT
   * SOAP/REST integration plugs in here without changing the public API.
   * Input: query with fiscal UUID, issuer RFC, receiver RFC and amount.
   * Output: Promise<CfdiStatus> with VALID | CANCELED | NOT_FOUND | PENDING.
   */
  async resolveStatus(query: CfdiValidationQuery): Promise<CfdiStatus> {
    if (!query.fiscal_uuid || !query.issuer_rfc || !query.receiver_rfc) {
      return 'NOT_FOUND';
    }

    const mode = (process.env.CFDI_VALIDATION_MODE || '').toLowerCase();
    if (mode === 'canceled') return 'CANCELED';
    if (mode === 'not_found') return 'NOT_FOUND';
    if (mode === 'pending') return 'PENDING';

    return 'VALID';
  }
}
