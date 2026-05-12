/**
 * FileName: provider-adapter.interface.ts
 * Description: Contract implemented by each travel provider adapter to expose a
 *              common flight search entry point.
 * Authors: Debug Studio (Diego de la Vega)
 * Last Modification made:
 * 2/05/2026 [Diego de la Vega] Added the fetchOffer line to receive the promise result.
 */

import { ProviderFlightQueryDto } from '../dto/provider-flight-query.dto';
import {
  ProviderErrorDto,
  UnifiedFlightOptionDto,
} from '../dto/unified-flight-option.dto';

export interface ProviderSearchResult {
  results: UnifiedFlightOptionDto[];
  error?: ProviderErrorDto;
}

export interface ProviderAdapter {
  readonly provider_id: string;
  readonly provider_name: string;

  searchFlights(query: ProviderFlightQueryDto): Promise<ProviderSearchResult>;
  fetchOffer(offerId: string): Promise<ProviderSearchResult>;
}