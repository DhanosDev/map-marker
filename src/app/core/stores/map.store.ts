import { Injectable, inject, signal, computed } from '@angular/core';
import { PostalCodeService } from '../api/postal-code.service';
import { Country, PostalCode, City } from '../models';
import { lastValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MapStore {
  private readonly postalCodeService = inject(PostalCodeService);

  readonly countries = signal<Country[]>([]);
  readonly selectedCountry = signal<Country | null>(null);
  readonly cities = signal<City[]>([]);
  readonly selectedCity = signal<City | null>(null);
  readonly postalCodes = signal<PostalCode[]>([]);
  readonly activeMarker = signal<PostalCode | null>(null);
  readonly searchQuery = signal<string>('');

  readonly isLoading = computed(() => this.postalCodeService.isLoading());
  readonly error = computed(() => this.postalCodeService.error());

  readonly hasSelectedCountry = computed(() => !!this.selectedCountry());
  readonly hasSelectedCity = computed(() => !!this.selectedCity());

  readonly filteredPostalCodes = computed(() => {
    const codes = this.postalCodes();
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) return codes;

    return codes.filter(
      (code) =>
        code.postalCode.toLowerCase().includes(query) ||
        code.placeName.toLowerCase().includes(query) ||
        code.region.toLowerCase().includes(query)
    );
  });

  readonly selectedCountryStats = computed(() => {
    const country = this.selectedCountry();
    const cities = this.cities();

    if (!country || !cities.length) return null;

    return {
      totalCities: cities.length,
      totalPostalCodes: cities.reduce((sum, city) => sum + city.postalCount, 0),
      avgPostalCodesPerCity: Math.round(
        cities.reduce((sum, city) => sum + city.postalCount, 0) / cities.length
      ),
    };
  });

  readonly selectedCityStats = computed(() => {
    const city = this.selectedCity();
    const codes = this.postalCodes();

    if (!city || !codes.length) return null;

    return {
      totalCodes: codes.length,
      filteredCount: this.filteredPostalCodes().length,
      expectedCodes: city.postalCount,
      avgLatitude:
        codes.reduce((sum, code) => sum + code.latitude, 0) / codes.length,
      avgLongitude:
        codes.reduce((sum, code) => sum + code.longitude, 0) / codes.length,
      regions: [...new Set(codes.map((code) => code.region))].length,
    };
  });

  constructor() {
    this.loadCountries();
  }

  async loadCountries(): Promise<void> {
    try {
      const countries = await lastValueFrom(
        this.postalCodeService.getCountries()
      );
      this.countries.set(countries || []);
    } catch (error) {
      console.error('❌ Failed to load countries:', error);
    }
  }

  selectCountry(country: Country): void {
    this.selectedCountry.set(country);

    this.clearCitySelection();

    this.loadCitiesForCountry(country.code);
  }

  async loadCitiesForCountry(countryCode: string): Promise<void> {
    try {
      const cities = await lastValueFrom(
        this.postalCodeService.getCitiesByCountry(countryCode)
      );
      this.cities.set(cities || []);
    } catch (error) {
      this.cities.set([]);
    }
  }

  selectCity(city: City): void {
    this.selectedCity.set(city);

    this.activeMarker.set(null);
    this.clearSearch();
    this.loadPostalCodesForCity(city.countryCode, city.name);
  }

  async loadPostalCodesForCity(
    countryCode: string,
    cityName: string
  ): Promise<void> {
    try {
      const codes = await lastValueFrom(
        this.postalCodeService.getPostalCodesByCity(countryCode, cityName)
      );
      this.postalCodes.set(codes || []);
    } catch (error) {
      console.error(`❌ Failed to load postal codes for ${cityName}:`, error);
      this.postalCodes.set([]);
    }
  }

  setActiveMarker(postalCode: PostalCode | null): void {
    this.activeMarker.set(postalCode);
    if (postalCode) {
      console.log(
        `📍 Active marker: ${postalCode.postalCode} - ${postalCode.placeName}`
      );
    }
  }

  updateSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  clearCitySelection(): void {
    this.selectedCity.set(null);
    this.cities.set([]);
    this.postalCodes.set([]);
    this.activeMarker.set(null);
    this.clearSearch();
  }

  clearSelection(): void {
    this.selectedCountry.set(null);
    this.clearCitySelection();
  }
}
