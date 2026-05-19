/**
 * FileName: cfdi-validation.service.ts
 * Description: Service for validating CFDI vouchers against SAT status. Provides a method to check the fiscal UUID of a voucher and return its current status (VALID, CANCELED, NOT_FOUND, PENDING) based on a configurable validation mode. This allows for flexible testing and integration with SAT's CFDI validation system.
 * Authors: Original Monarca team
 * Last Modification made:
 * 17/05/2026 [Santiago Coronado Hernández and Juan Pablo Narchi] Implemented CfdiValidationService with validateSatStatus method that returns CFDI status based on environment variable configuration for testing different scenarios without real SAT API calls.
 */

import { Injectable } from '@nestjs/common';
import { CfdiStatus } from '../types/cfdi-status.type';

@Injectable()
export class CfdiValidationService {
  async validateSatStatus(_fiscalUuid: string): Promise<CfdiStatus> {
    const mode = (process.env.CFDI_VALIDATION_MODE || '').toLowerCase();

    if (mode === 'canceled') {
      return 'CANCELED';
    }

    if (mode === 'not_found') {
      return 'NOT_FOUND';
    }

    if (mode === 'pending') {
      return 'PENDING';
    }

    return 'VALID';
  }
}
