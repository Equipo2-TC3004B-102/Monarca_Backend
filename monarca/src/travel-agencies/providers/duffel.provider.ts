/**
 * FileName: duffel.provider.ts
 * Description: Duffel provider adapter that searches flights and normalizes the
 *              response into the shared provider format.
 * Authors: Debug Studio (Diego de la Vega)
 * Last Modification made:
 * 10/05/2026 [Diego de la Vega] Added the "data" key required by Duffel, polling of offers, caching of the Banxico exchange rates and
   presentation of the 5 best travel offers.
 */

import { Injectable } from '@nestjs/common';
import { ProviderFlightQueryDto } from '../dto/provider-flight-query.dto';
import {
  ProviderErrorDto,
  UnifiedFlightOptionDto,
  UnifiedFlightSegmentDto,
} from '../dto/unified-flight-option.dto';
import { ProviderAdapter, ProviderSearchResult } from './provider-adapter.interface';

const BANXICO_CURRENCY_MAPPING: Record<string, string> = {
  USD: 'SF43718',
  EUR: 'SF46410',
  JPY: 'SF46406',
  GBP: 'SF46407',
  CAD: 'SF60632',
  CHF: 'SF46405',
  CNY: 'SF290383',
  BRL: 'SF290312',
  ARS: 'SF290311',
  CLP: 'SF290351',
  COP: 'SF290382',
};

@Injectable()
export class DuffelProvider implements ProviderAdapter {
  readonly provider_id = 'duffel';
  readonly provider_name = 'Duffel';

  async searchFlights(query: ProviderFlightQueryDto): Promise<ProviderSearchResult> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      return {
        results: [],
        error: this.buildError(
          'PROVIDER_DUFFEL_TOKEN_MISSING',
          'Duffel access token is not configured in the environment.',
        ),
      };
    }

    try {
      const url = `${this.getBaseUrl()}/air/offer_requests`;
      const payload = { data: this.buildSearchPayload(query) };
      // Log payload for debugging external provider calls
      console.debug('[Duffel] request payload:', JSON.stringify(payload));

      // Use AbortController to avoid hanging requests to external API
      const timeoutMs = 15000;
      const fetchPromise = fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Duffel-Version': 'v2',
        },
        // Use of top level "data" key
        body: JSON.stringify(payload),
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('DUFFEL_TIMEOUT')), timeoutMs),
      );

      let response;
      try {
        response = await Promise.race([fetchPromise, timeoutPromise]);
      } catch (err: any) {
        const errorMessage = err?.message ?? String(err);
        console.error('[Duffel] fetch failed or timed out:', errorMessage);
        return {
          results: [],
          error: this.buildError(
            'PROVIDER_DUFFEL_UNAVAILABLE',
            'Duffel provider is unavailable right now.',
          ),
        };
      }

      if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        return {
          results: [],
          error: this.buildError(
            'PROVIDER_DUFFEL_REQUEST_FAILED',
            `Duffel request failed with HTTP ${response.status}${bodyText ? `: ${bodyText}` : ''}`,
          ),
        };
      }

      const rawData = await response.json();

      let offers: any[] = Array.isArray(rawData?.offers)
        ? rawData.offers
        : Array.isArray(rawData?.data?.offers)
          ? rawData.data.offers
          : [];

      // Polling of the Duffel offers associated with the offer_request in case we don't get offers immediately.
      const offerRequestId = String(rawData?.id ?? rawData?.data?.id ?? '').trim();
      if ((!offers || offers.length === 0) && offerRequestId) {
        console.debug('[Duffel] received offer_request id, polling for offers:', offerRequestId);

        const maxAttempts = 5;
        const delayMs = 1200;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            // Query offers by offer_request_id
            const offersUrl = `${this.getBaseUrl()}/air/offers?offer_request_id=${encodeURIComponent(
              offerRequestId,
            )}`;
            const offersResp = await fetch(offersUrl, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'Duffel-Version': 'v2',
              },
            });

            if (!offersResp.ok) {
              const bodyText = await offersResp.text().catch(() => '');
              console.debug('[Duffel] offers poll returned non-ok status:', offersResp.status, bodyText);
              // If we get a client error (4xx) abort polling to avoid processing unavailable data.
              if (offersResp.status >= 400 && offersResp.status < 500) {
                return {
                  results: [],
                  error: this.buildError(
                    'PROVIDER_DUFFEL_REQUEST_FAILED',
                    `Duffel offers polling failed with HTTP ${offersResp.status}${bodyText ? `: ${bodyText}` : ''}`,
                  ),
                };
              }
              // For 5xx, keep retrying until attempts are exhausted
            } else {
              const offersData = await offersResp.json().catch(() => ({}));
              offers = Array.isArray(offersData?.offers)
                ? offersData.offers
                : Array.isArray(offersData?.data?.offers)
                  ? offersData.data.offers
                  : [];

              if (offers && offers.length > 0) {
                console.debug('[Duffel] received offers from poll, count=', offers.length);
                break;
              }
            }
          } catch (err: any) {
            const errorMessage = err?.message ?? String(err);
            console.debug('[Duffel] polling error (will retry):', errorMessage);
          }

          // Wait before next attempt
          await new Promise((res) => setTimeout(res, delayMs));
        }
      }

      // Pre-calculate exchange rates for all currencies present in offers to avoid
      // N API calls to Banxico.
      const currenciesNeeded = new Set<string>();
      for (const offer of offers) {
        const currency = String(
          offer?.total_currency ?? offer?.price?.total_currency ?? offer?.currency ?? 'MXN',
        ).toUpperCase();
        if (currency !== 'MXN') {
          currenciesNeeded.add(currency);
        }
      }
      const rateCache = new Map<string, number>();
      for (const currency of currenciesNeeded) {
        const rate = await this.fetchBanxicoRate(currency);
        rateCache.set(currency, rate ?? 1);
      }

      // Normalize, deduplicate and sort offers by price (ascending) and return top 5
      const seen = new Map<string, UnifiedFlightOptionDto>();
      for (const offer of offers) {
        const normalized = await this.mapOffer(offer, rateCache);
        if (normalized && !seen.has(normalized.provider_offer_id)) {
          seen.set(normalized.provider_offer_id, normalized);
        }
      }

      const results = Array.from(seen.values()).sort((a, b) => {
        const pa = Number(a.total_price_mxn ?? a.original_price ?? 0);
        const pb = Number(b.total_price_mxn ?? b.original_price ?? 0);
        return pa - pb;
      }).slice(0, 5);

      return { results };
    } catch (error) {
      console.error('Duffel provider search failed:', error);
      return {
        results: [],
        error: this.buildError(
          'PROVIDER_DUFFEL_UNAVAILABLE',
          'Duffel provider is unavailable right now.',
        ),
      };
    }
  }

  async fetchOffer(offerId: string): Promise<ProviderSearchResult> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      return {
        results: [],
        error: this.buildError(
          'PROVIDER_DUFFEL_TOKEN_MISSING',
          'Duffel access token is not configured in the environment.',
        ),
      };
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/air/offers/${offerId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Duffel-Version': 'v2',
        },
      });

      if (!response.ok) {
        const bodyText = await response.text().catch(() => '');
        return {
          results: [],
          error: this.buildError(
            'PROVIDER_DUFFEL_REQUEST_FAILED',
            `Duffel request failed with HTTP ${response.status}${bodyText ? `: ${bodyText}` : ''}`,
          ),
        };
      }

      const rawData = await response.json();
      const offer = rawData?.data ?? rawData;
      const normalized = await this.mapOffer(offer);

      if (!normalized) {
        return {
          results: [],
          error: this.buildError(
            'PROVIDER_DUFFEL_INVALID_OFFER',
            `Failed to normalize offer ${offerId}`,
          ),
        };
      }

      return { results: [normalized] };
    } catch (error) {
      console.error('Duffel provider fetchOffer failed:', error);
      return {
        results: [],
        error: this.buildError(
          'PROVIDER_DUFFEL_UNAVAILABLE',
          'Duffel provider is unavailable right now.',
        ),
      };
    }
  }

  private getBaseUrl() {
    return process.env.DUFFEL_API_BASE_URL ?? 'https://api.duffel.com';
  }

  private getAccessToken() {
    return (
      process.env.DUFFEL_ACCESS_TOKEN ??
      process.env.DUFFEL_API_TOKEN ??
      process.env.DUFFEL_TOKEN ??
      ''
    ).trim();
  }

  private buildSearchPayload(query: ProviderFlightQueryDto) {
    const slices = [
      {
        origin: query.origin_airport_code,
        destination: query.destination_airport_code,
        departure_date: query.departure_date,
      },
    ];

    if (query.return_date) {
      slices.push({
        origin: query.destination_airport_code,
        destination: query.origin_airport_code,
        departure_date: query.return_date,
      });
    }

    return {
      slices,
      passengers: Array.from({ length: query.passengers }, () => ({ type: 'adult' })),
      cabin_class: 'economy',
    };
  }

  private async mapOffer(
    offer: any,
    rateCache?: Map<string, number>,
  ): Promise<UnifiedFlightOptionDto | null> {
    const providerOfferId = String(offer?.id ?? offer?.offer_id ?? '').trim();
    if (!providerOfferId) {
      return null;
    }

    const segments = this.extractSegments(offer);
    const normalizedSegments = await Promise.all(
      segments.map((segment) => this.mapSegment(segment)),
    );

    const airline = this.readAirline(offer);

    const priceAmount = this.readNumeric(
      offer?.total_amount ?? offer?.price?.total_amount ?? offer?.amount,
    );
    const currency = String(
      offer?.total_currency ?? offer?.price?.total_currency ?? offer?.currency ?? 'MXN',
    ).toUpperCase();

    return {
      provider_offer_id: providerOfferId,
      provider_id: this.provider_id,
      provider_name: this.provider_name,
      total_price_mxn: await this.convertToMxn(priceAmount, currency, rateCache),
      original_price: priceAmount,
      original_currency: currency,
      airline,
      stops: Math.max(normalizedSegments.length - 1, 0),
      segments: normalizedSegments,
    };
  }

  private extractSegments(offer: any): any[] {
    const slices = Array.isArray(offer?.slices) ? offer.slices : [];
    return slices.flatMap((slice) => (Array.isArray(slice?.segments) ? slice.segments : []));
  }

  private async mapSegment(segment: any): Promise<UnifiedFlightSegmentDto> {
    const origin = segment?.origin ?? {};
    const destination = segment?.destination ?? {};

    return {
      origin_airport_code: this.readAirportCode(origin),
      origin_city: this.readCityName(origin),
      destination_airport_code: this.readAirportCode(destination),
      destination_city: this.readCityName(destination),
      departure_at: String(segment?.departing_at ?? segment?.departure_at ?? ''),
      arrival_at: String(segment?.arriving_at ?? segment?.arrival_at ?? ''),
    };
  }

  private readAirportCode(location: any): string {
    return String(
      location?.iata_code ?? location?.airport_code ?? location?.code ?? '',
    ).trim();
  }

  private readCityName(location: any): string {
    return String(
      location?.city_name ?? location?.city ?? location?.name ?? '',
    ).trim();
  }

  private readAirline(offer: any): string | undefined {
    const segments = this.extractSegments(offer);
    for (const segment of segments) {
      const carrier =
        segment?.operating_carrier ?? segment?.marketing_carrier ?? segment?.carrier;
      const airlineName = String(carrier?.name ?? carrier?.iata_code ?? '').trim();
      if (airlineName) {
        return airlineName;
      }
    }

    const ownerName = String(offer?.owner?.name ?? offer?.owner?.iata_code ?? '').trim();
    return ownerName || undefined;
  }

  private readNumeric(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private async convertToMxn(
    amount: number,
    currency: string,
    rateCache?: Map<string, number>,
  ): Promise<number> {
    if (!amount || currency === 'MXN') {
      return amount;
    }

    if (rateCache && rateCache.has(currency)) {
      const rate = rateCache.get(currency);
      if (rate && rate > 0) {
        return Math.round(amount * rate * 100) / 100;
      }
      return amount;
    }

    const rate = await this.fetchBanxicoRate(currency);
    if (!rate) {
      console.warn(`Could not convert Duffel price from ${currency} to MXN.`);
      return amount;
    }

    return Math.round(amount * rate * 100) / 100;
  }

  private async fetchBanxicoRate(currency: string): Promise<number | null> {
    const banxicoId = BANXICO_CURRENCY_MAPPING[currency];
    if (!banxicoId) return null;

    const bmxToken = process.env['BMX-TOKEN'];
    if (!bmxToken) {
      return null;
    }

    try {
      const url = `https://www.banxico.org.mx/SieAPIRest/service/v1/series/${banxicoId}/datos/oportuno`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Bmx-Token': bmxToken,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const rawData = await response.json();
      const data = rawData?.bmx?.series?.[0]?.datos?.[0];
      if (!data?.dato) {
        return null;
      }

      const rate = parseFloat(data.dato);
      return Number.isFinite(rate) ? rate : null;
    } catch {
      return null;
    }
  }

  private buildError(code: string, message: string): ProviderErrorDto {
    return {
      provider_id: this.provider_id,
      provider_name: this.provider_name,
      code,
      message,
    };
  }
}