import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, retry, timeout } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  CountryFacetResponse,
  OpenDataSoftResponse,
} from '../models/api-response.interface';
import { PostalCode } from '../models/postal-code.interface';
@Injectable({ providedIn: 'root' })
export class PostalCodeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl =
    'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/geonames-postal-code';

  isLoading = signal(false);
  error = signal<string | null>(null);

  getCountries(): Observable<CountryFacetResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http
      .get<CountryFacetResponse>(`${this.baseUrl}/facets`, {
        params: {
          facet: 'country_code',
        },
      })
      .pipe(
        timeout(10000),
        retry({ count: 2, delay: 1000 }),
        catchError((error) => this.handleError(error))
      );
  }

  getPostalCodesByCountry(
    countryCode: string
  ): Observable<OpenDataSoftResponse<PostalCode>> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http
      .get<OpenDataSoftResponse<PostalCode>>(`${this.baseUrl}/records`, {
        params: {
          refine: `country_code:"${countryCode}"`,
          rows: 1000,
        },
      })
      .pipe(
        timeout(15000),
        retry({ count: 2, delay: 1000 }),
        catchError((error) => this.handleError(error))
      );
  }

  private handleError(error: HttpErrorResponse): never {
    this.isLoading.set(false);
    const message = error.message || 'An error occurred';
    this.error.set(message);
    throw error;
  }
}
