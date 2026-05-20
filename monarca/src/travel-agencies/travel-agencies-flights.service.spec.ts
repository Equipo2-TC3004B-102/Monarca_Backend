/**
 * FileName: travel-agencies-flights.service.spec.ts
 * Description: Unit tests for the flight aggregation service. Verifies that the service merges provider results and preserves provider errors.
 * Authors: Debug Studio (Diego de la Vega)
 * Last Modification made:
 * 23/04/2026 [Diego de la Vega] Added aggregation service tests with the help of Github Copilot. This mocks a provider result to ensure it complies with the request/response format.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ProviderAdapter } from './providers/provider-adapter.interface';
import { TRAVEL_AGENCIES_PROVIDER_ADAPTERS } from './providers/travel-agencies-provider.token';
import { TravelAgenciesFlightsService } from './travel-agencies-flights.service';

describe('TravelAgenciesFlightsService', () => {
  let service: TravelAgenciesFlightsService;
  let duffelProvider: ProviderAdapter;

  beforeEach(async () => {
    duffelProvider = {
      provider_id: 'duffel',
      provider_name: 'Duffel',
      searchFlights: jest.fn().mockResolvedValue({
        results: [
          {
            provider_offer_id: 'off_1',
            provider_id: 'duffel',
            provider_name: 'Duffel',
            total_price_mxn: 1234.5,
            segments: [],
          },
        ],
      }),
      fetchOffer: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TravelAgenciesFlightsService,
        {
          provide: TRAVEL_AGENCIES_PROVIDER_ADAPTERS,
          useValue: [duffelProvider],
        },
      ],
    }).compile();

    service = module.get<TravelAgenciesFlightsService>(TravelAgenciesFlightsService);
  });

  it('should merge provider results into one response', async () => {
    const result = await service.searchFlights({
      origin_airport_code: 'MEX',
      destination_airport_code: 'CUN',
      departure_date: '2026-05-20',
      passengers: 1,
    });

    expect(result.results).toHaveLength(1);
    expect(result.provider_errors).toHaveLength(0);
    expect(result.results_count).toBe(1);
    expect(result.providers_used).toEqual(['duffel']);
    expect(result.partial_success).toBe(false);
    expect(result.query).toMatchObject({
      origin_airport_code: 'MEX',
      destination_airport_code: 'CUN',
      departure_date: '2026-05-20',
      passengers: 1,
    });
    expect(duffelProvider.searchFlights).toHaveBeenCalledTimes(1);
  });

  it('should preserve provider errors without failing the whole search', async () => {
    duffelProvider.searchFlights = jest.fn().mockRejectedValue(new Error('Duffel timeout'));

    const result = await service.searchFlights({
      origin_airport_code: 'MEX',
      destination_airport_code: 'CUN',
      departure_date: '2026-05-20',
      passengers: 1,
    });

    expect(result.results).toHaveLength(0);
    expect(result.provider_errors).toHaveLength(1);
    expect(result.results_count).toBe(0);
    expect(result.providers_used).toEqual(['duffel']);
    expect(result.partial_success).toBe(false);
    expect(result.provider_errors[0]).toMatchObject({
      provider_id: 'duffel',
      provider_name: 'Duffel',
      code: 'PROVIDER_SEARCH_UNEXPECTED_ERROR',
      message: 'Duffel timeout',
    });
  });

  describe('compareOffers', () => {
    it('should compare selected offers and return them sorted by price', async () => {
      duffelProvider.fetchOffer = jest
        .fn()
        .mockResolvedValueOnce({
          results: [
            {
              provider_offer_id: 'off_1',
              provider_id: 'duffel',
              provider_name: 'Duffel',
              total_price_mxn: 2500,
              segments: [],
            },
          ],
        })
        .mockResolvedValueOnce({
          results: [
            {
              provider_offer_id: 'off_2',
              provider_id: 'duffel',
              provider_name: 'Duffel',
              total_price_mxn: 1800,
              segments: [],
            },
          ],
        });

      const result = await service.compareOffers({
        selected: [
          { provider_id: 'duffel', provider_offer_id: 'off_1' },
          { provider_id: 'duffel', provider_offer_id: 'off_2' },
        ],
        query: {
          origin_airport_code: 'MEX',
          destination_airport_code: 'CUN',
          departure_date: '2026-05-20',
          passengers: 1,
        },
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0].total_price_mxn).toBe(1800);
      expect(result.results[1].total_price_mxn).toBe(2500);
      expect(result.provider_errors).toHaveLength(0);
      expect(result.results_count).toBe(2);
      expect(result.providers_used).toEqual(['duffel']);
      expect(result.partial_success).toBe(false);
      expect(duffelProvider.fetchOffer).toHaveBeenCalledTimes(2);
    });

    it('should include provider errors without failing the whole comparison', async () => {
      duffelProvider.fetchOffer = jest.fn().mockResolvedValueOnce({
        results: [],
        error: {
          provider_id: 'duffel',
          provider_name: 'Duffel',
          code: 'PROVIDER_DUFFEL_REQUEST_FAILED',
          message: 'Offer not found',
        },
      });

      const result = await service.compareOffers({
        selected: [{ provider_id: 'duffel', provider_offer_id: 'off_invalid' }],
      });

      expect(result.results).toHaveLength(0);
      expect(result.provider_errors).toHaveLength(1);
      expect(result.provider_errors[0]).toMatchObject({
        provider_id: 'duffel',
        provider_name: 'Duffel',
        code: 'PROVIDER_DUFFEL_REQUEST_FAILED',
        message: 'Offer not found',
      });
      expect(result.results_count).toBe(0);
    });
  });
});