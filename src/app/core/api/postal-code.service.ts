import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Observable,
  map,
  catchError,
  finalize,
  switchMap,
  forkJoin,
  of,
} from 'rxjs';
import {
  OpenDataSoftFacetsResponse,
  OpenDataSoftRecordsResponse,
  GroupedCitiesResponse,
  Country,
  PostalCode,
  City,
} from '../models';
import { getCountryName } from '../utils/country-mapping.util';

@Injectable({ providedIn: 'root' })
export class PostalCodeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl =
    'https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/geonames-postal-code';

  isLoading = signal(false);
  error = signal<string | null>(null);

  getCountries(): Observable<Country[]> {
    this.setLoading(true);

    const params = new HttpParams().set('facet', 'country_code');

    return this.http
      .get<OpenDataSoftFacetsResponse>(`${this.baseUrl}/facets`, { params })
      .pipe(
        map((response) => this.mapFacetsToCountries(response)),
        catchError((error) =>
          this.handleError('Failed to load countries', error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  getCitiesByCountry(countryCode: string): Observable<City[]> {
    this.setLoading(true);

    const params = new HttpParams()
      .set('refine', `country_code:"${countryCode}"`)
      .set('select', 'place_name,count(postal_code) as postal_count')
      .set('group_by', 'place_name')
      .set('order_by', 'postal_count desc')
      .set('limit', '10000');

    return this.http
      .get<GroupedCitiesResponse>(`${this.baseUrl}/records`, { params })
      .pipe(
        map((response) => this.mapGroupedCitiesToCities(response, countryCode)),
        catchError((error) =>
          this.handleError(`Failed to load cities for ${countryCode}`, error)
        ),
        finalize(() => this.setLoading(false))
      );
  }

  private loadPostalCodesPage(
    countryCode: string,
    cityName: string,
    start: number
  ): Observable<OpenDataSoftRecordsResponse> {
    const params = new HttpParams()
      .set('refine', `country_code:${countryCode}`)
      .append('refine', `place_name:${cityName}`)
      .set('rows', '100')
      .set('start', start.toString());

    return this.http.get<OpenDataSoftRecordsResponse>(
      `${this.baseUrl}/records`,
      { params }
    );
  }

  getPostalCodesByCity(
    countryCode: string,
    cityName: string
  ): Observable<PostalCode[]> {
    this.setLoading(true);

    return this.loadPostalCodesPage(countryCode, cityName, 0).pipe(
      switchMap((firstPageResponse) => {
        const totalCount = firstPageResponse.total_count;
        const firstPageCodes = this.mapRecordsToPostalCodes(firstPageResponse);

        if (totalCount <= 100) {
          return of(firstPageCodes);
        } else {
          const totalPages = Math.ceil(totalCount / 100);
          const remainingPageRequests = [];

          for (let page = 1; page < totalPages; page++) {
            remainingPageRequests.push(
              this.loadPostalCodesPage(countryCode, cityName, page * 100).pipe(
                map((response) => this.mapRecordsToPostalCodes(response))
              )
            );
          }

          return forkJoin(remainingPageRequests).pipe(
            map((allPagesResults) => {
              return [firstPageCodes, ...allPagesResults].flat();
            })
          );
        }
      }),
      catchError((error) =>
        this.handleError(`Failed to load postal codes for ${cityName}`, error)
      ),
      finalize(() => this.setLoading(false))
    );
  }

  private mapFacetsToCountries(
    response: OpenDataSoftFacetsResponse
  ): Country[] {
    const countryCodeFacet = response.facets.find(
      (f) => f.name === 'country_code'
    );

    if (!countryCodeFacet || !countryCodeFacet.facets) {
      console.warn('No country_code facet found in response', response);
      return [];
    }

    return countryCodeFacet.facets.map((facet) => ({
      code: facet.value,
      name: getCountryName(facet.value),
      count: facet.count,
    }));
  }

  private mapGroupedCitiesToCities(
    response: GroupedCitiesResponse,
    countryCode: string
  ): City[] {
    return response.results.map((result) => ({
      name: result.place_name,
      postalCount: result.postal_count,
      countryCode: countryCode,
    }));
  }

  private mapRecordsToPostalCodes(
    response: OpenDataSoftRecordsResponse
  ): PostalCode[] {
    return response.results.map((record) => ({
      postalCode: record.postal_code,
      placeName: record.place_name,
      countryCode: record.country_code,
      latitude: record.latitude,
      longitude: record.longitude,
      region: record.admin_name1 || '',
      regionCode: record.admin_code1 || '',
      department: record.admin_name2 || '',
      departmentCode: record.admin_code2 || '',
      subRegion: record.admin_name3 || '',
      subRegionCode: record.admin_code3 || '',
      accuracy: record.accuracy || 1,
    }));
  }

  private setLoading(loading: boolean): void {
    this.isLoading.set(loading);
    if (loading) this.error.set(null);
  }

  private handleError(message: string, error: any): Observable<never> {
    console.error('PostalCodeService Error:', error);
    this.error.set(message);
    throw error;
  }
}
