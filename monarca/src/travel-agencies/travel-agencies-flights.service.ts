/**
 * FileName: travel-agencies-flights.service.ts
 * Description: Aggregates flight search and comparison results from configured providers and returns a unified provider-agnostic response.
 * Authors: Debug Studio (Diego de la Vega)
 * Last Modification made:
 * 06/05/2026 [Diego de la Vega] Added comparison flow for selected provider offers and top-price sorting, for both single/multi-destination.
 */

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ProviderFlightQueryDto } from './dto/provider-flight-query.dto';
import { CompareRequestDto } from './dto/compare-request.dto';
import { FlightSearchMultiSegmentDto } from './dto/flight-search-multi-segment.dto';
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

    const results = this.sortAndLimitResults(
      providerResults.flatMap((result) => result.results),
    );
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

  async searchFlightsMultiSegment(query: FlightSearchMultiSegmentDto) {
    const resultsBySegment: any[] = [];
    const allProviderErrors: ProviderErrorDto[] = [];
    const providersUsed = new Set<string>();

    // Search each segment independently
    for (let segmentIndex = 0; segmentIndex < query.slices.length; segmentIndex++) {
      const segment = query.slices[segmentIndex];
      const segmentQuery: ProviderFlightQueryDto = {
        origin_airport_code: segment.origin,
        destination_airport_code: segment.destination,
        departure_date: segment.departure_date,
        passengers: query.passengers,
      };

      const providerResults = await Promise.all(
        this.providers.map(async (provider) => {
          try {
            return await provider.searchFlights(segmentQuery);
          } catch (error) {
            return this.buildUnexpectedResult(provider, error);
          }
        }),
      );

      const segmentResults = this.sortAndLimitResults(
        providerResults.flatMap((result) => result.results),
      );
      const segmentErrors = providerResults.flatMap((result) =>
        result.error ? [result.error] : [],
      );

      providerResults.forEach((_, index) => {
        const providerId = this.providers[index]?.provider_id;
        if (providerId) providersUsed.add(providerId);
      });

      allProviderErrors.push(...segmentErrors);

      resultsBySegment.push({
        segment_index: segmentIndex,
        route: `${segment.origin} -> ${segment.destination}`,
        results: segmentResults,
      });
    }

    return {
      results_by_segment: resultsBySegment,
      provider_errors: allProviderErrors,
      query,
      total_segments: query.slices.length,
      providers_used: Array.from(providersUsed),
    };
  }

  async compareOffers(
    body: CompareRequestDto,
  ): Promise<UnifiedFlightSearchResponseDto> {
    if (!body.selected || body.selected.length === 0) {
      throw new BadRequestException({
        message: 'At least one offer must be selected.',
        code: 'TRAVEL_AGENCIES_COMPARE_OFFERS_REQUIRED',
      });
    }

    const providerErrors: ProviderErrorDto[] = [];
    const results: Awaited<ReturnType<ProviderAdapter['fetchOffer']>>['results'] = [];
    const providersUsed = new Set<string>();

    for (const selected of body.selected) {
      const provider = this.providers.find(
        (currentProvider) => currentProvider.provider_id === selected.provider_id,
      );

      if (!provider) {
        providerErrors.push({
          provider_id: selected.provider_id,
          provider_name: selected.provider_id,
          code: 'PROVIDER_NOT_FOUND',
          message: `Provider ${selected.provider_id} is not configured`,
        });
        continue;
      }

      providersUsed.add(provider.provider_id);

      try {
        const providerResult = await provider.fetchOffer(selected.provider_offer_id);
        if (providerResult.error) {
          providerErrors.push(providerResult.error);
          continue;
        }

        results.push(...providerResult.results);
      } catch (error) {
        providerErrors.push(this.buildUnexpectedError(provider, error));
      }
    }

    const sortedResults = this.sortAndLimitResults(results);

    return {
      results: sortedResults,
      provider_errors: providerErrors,
      query: body.query,
      results_count: sortedResults.length,
      providers_used: Array.from(providersUsed),
      partial_success: providerErrors.length > 0 && sortedResults.length > 0,
    };
  }

  private sortAndLimitResults(results: UnifiedFlightSearchResponseDto['results']) {
    return [...results]
      .sort((leftResult, rightResult) => leftResult.total_price_mxn - rightResult.total_price_mxn)
      .slice(0, 5);
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