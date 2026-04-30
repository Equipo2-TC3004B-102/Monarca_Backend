/**
 * FileName: travel-agencies-flights.service.ts
 * Description: Aggregates flight search results from configured providers and returns a unified provider-agnostic response.
 * Authors: Debug Studio (Diego de la Vega)
 * Last Modification made:
 * 22/04/2026 [Diego de la Vega] Added provider aggregation service for flight searches in different providers (Amadeus pending to be implemented too).
 */

import { Inject, Injectable } from '@nestjs/common';
import { ProviderFlightQueryDto } from './dto/provider-flight-query.dto';
import {
  ProviderErrorDto,
  UnifiedFlightSearchResponseDto,
} from './dto/unified-flight-option.dto';
import { ProviderAdapter, ProviderSearchResult } from './providers/provider-adapter.interface';
import { TRAVEL_AGENCIES_PROVIDER_ADAPTERS } from './providers/travel-agencies-provider.token';

@Injectable()
export class TravelAgenciesFlightsService {
  constructor(
    @Inject(TRAVEL_AGENCIES_PROVIDER_ADAPTERS)
    private readonly providers: ProviderAdapter[],
  ) {}

  async searchFlights(
    query: ProviderFlightQueryDto,
  ): Promise<UnifiedFlightSearchResponseDto> {
    const providerResults = await Promise.all(
      this.providers.map(async (provider) => {
        try {
          return await provider.searchFlights(query);
        } catch (error) {
          return this.buildUnexpectedResult(provider, error);
        }
      }),
    );

    const results = providerResults.flatMap((result) => result.results);
    const providerErrors = providerResults.flatMap((result) =>
      result.error ? [result.error] : [],
    );
    const providersUsed = providerResults
      .map((_, index) => this.providers[index]?.provider_id)
      .filter((providerId): providerId is string => Boolean(providerId));

    return {
      results,
      provider_errors: providerErrors,
      query,
      results_count: results.length,
      providers_used: providersUsed,
      partial_success: providerErrors.length > 0 && results.length > 0,
    };
  }

  private buildUnexpectedResult(
    provider: ProviderAdapter,
    error: unknown,
  ): ProviderSearchResult {
    return {
      results: [],
      error: this.buildUnexpectedError(provider, error),
    };
  }

  private buildUnexpectedError(
    provider: ProviderAdapter,
    error: unknown,
  ): ProviderErrorDto {
    const message = error instanceof Error ? error.message : 'Unexpected provider error';

    return {
      provider_id: provider.provider_id,
      provider_name: provider.provider_name,
      code: 'PROVIDER_SEARCH_UNEXPECTED_ERROR',
      message,
    };
  }
}