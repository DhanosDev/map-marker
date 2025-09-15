import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MapStore } from '../../core/stores/map.store';
import { MapCanvasComponent } from './components/map-canvas.component';
import { PostalCode } from '../../core/models/business.interfaces';

@Component({
  selector: 'app-location-map-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MapCanvasComponent],
  template: `
    <div class="min-h-screen bg-gray-900 text-white">
      <!-- Header (mantener igual) -->
      <header class="p-4 border-b border-gray-700">
        <div class="container mx-auto flex items-center justify-between">
          <h1 class="text-xl font-bold">Postal Code Map</h1>
          <button
            class="text-gray-300 hover:text-white transition-colors"
            (click)="goBack()"
          >
            ← Back
          </button>
        </div>
      </header>

      <!-- Loading State (mantener igual) -->
      @if (mapStore.isLoading()) {
        <div class="flex items-center justify-center p-8">
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"
            ></div>
            <p class="text-gray-400">Loading...</p>
          </div>
        </div>
      }

      <!-- Error State (mantener igual) -->
      @if (mapStore.error()) {
        <div class="p-4">
          <div class="bg-red-900 border border-red-700 rounded-lg p-4">
            <p class="text-red-200">{{ mapStore.error() }}</p>
            <button
              class="mt-2 bg-red-700 hover:bg-red-600 px-4 py-2 rounded transition-colors"
              (click)="mapStore.loadCountries()"
            >
              Retry
            </button>
          </div>
        </div>
      }

      <!-- Main Content -->
      <main class="container mx-auto p-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Map Section - AGREGAR ViewChild reference y marker click handler -->
          <div class="bg-gray-800 rounded-lg p-4">
            <h2 class="text-lg font-semibold mb-4">
              Map View
              @if (mapStore.isLoading()) {
                <span class="text-sm text-gray-400">(Loading...)</span>
              }
            </h2>
            <app-map-canvas
              #mapCanvas
              [postalCodes]="mapStore.postalCodes"
              (markerClicked)="onMarkerClick($event)"
            ></app-map-canvas>
          </div>

          <!-- Controls & Results Section -->
          <div class="bg-gray-800 rounded-lg p-4">
            <h2 class="text-lg font-semibold mb-4">Search & Results</h2>

            <!-- Country Selector (mantener igual) -->
            <div class="mb-4">
              <label class="block text-sm font-medium mb-2"
                >Select Country</label
              >
              <select
                class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                [value]="mapStore.selectedCountry()?.code || ''"
                (change)="onCountryChange($event)"
              >
                <option value="">Choose a country...</option>
                @for (country of mapStore.countries(); track country.code) {
                  <option [value]="country.code">
                    {{ country.name }} ({{ country.count.toLocaleString() }}
                    codes)
                  </option>
                }
              </select>
            </div>

            <!-- City Selector (mantener igual) -->
            @if (mapStore.hasSelectedCountry()) {
              <div class="mb-4">
                <label class="block text-sm font-medium mb-2"
                  >Select City</label
                >
                <select
                  class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                  [value]="mapStore.selectedCity()?.name || ''"
                  (change)="onCityChange($event)"
                >
                  <option value="">Choose a city...</option>
                  @for (city of mapStore.cities(); track city.name) {
                    <option [value]="city.name">
                      {{ city.name }} ({{ city.postalCount.toLocaleString() }}
                      codes)
                    </option>
                  }
                </select>
              </div>
            }

            <!-- TABLA DE RESULTADOS - UPDATED con sync functionality -->
            <div class="bg-gray-700 rounded p-3 min-h-[300px]">
              @if (
                mapStore.hasSelectedCity() && mapStore.postalCodes().length > 0
              ) {
                <!-- Header -->
                <h3 class="font-medium mb-3">
                  Postal Codes in {{ mapStore.selectedCity()?.name }}
                  <span class="text-sm font-normal text-gray-400">
                    ({{ mapStore.postalCodes().length }} total)
                  </span>
                </h3>

                <!-- VIRTUAL SCROLL MANUAL con sync highlighting -->
                <div class="h-80 overflow-y-auto" (scroll)="onScroll($event)">
                  <div class="space-y-2">
                    @for (
                      code of visiblePostalCodes();
                      track trackByPostalCode($index, code)
                    ) {
                      <div
                        class="p-3 rounded cursor-pointer transition-colors"
                        [class]="getRowClasses(code)"
                        (click)="onPostalCodeClick(code)"
                      >
                        <div class="font-medium text-white">
                          {{ code.postalCode }}
                        </div>
                        <div class="text-sm text-gray-300">
                          {{ code.placeName }}
                        </div>
                        <div class="text-xs text-gray-400">
                          {{ code.latitude.toFixed(4) }},
                          {{ code.longitude.toFixed(4) }}
                        </div>
                        @if (code.region) {
                          <div class="text-xs text-gray-500">
                            {{ code.region }}
                          </div>
                        }
                      </div>
                    }
                  </div>

                  <!-- Load More Indicator -->
                  @if (hasMore()) {
                    <div class="text-center py-4">
                      <span class="text-gray-400 text-sm">Loading more...</span>
                    </div>
                  }
                </div>
              } @else if (
                mapStore.hasSelectedCountry() && !mapStore.hasSelectedCity()
              ) {
                <!-- Esperando selección de ciudad -->
                <div class="text-center py-12">
                  <p class="text-gray-400">
                    Select a city to view postal codes
                  </p>
                  <p class="text-xs text-gray-500 mt-2">
                    {{ mapStore.cities().length }} cities available in
                    {{ mapStore.selectedCountry()?.name }}
                  </p>
                </div>
              } @else if (!mapStore.hasSelectedCountry()) {
                <!-- Estado inicial -->
                <div class="text-center py-12">
                  <p class="text-gray-400">Select a country to start</p>
                </div>
              } @else if (
                mapStore.hasSelectedCity() &&
                !mapStore.postalCodes().length &&
                !mapStore.isLoading()
              ) {
                <!-- Sin datos -->
                <div class="text-center py-12">
                  <p class="text-gray-400">
                    No postal codes found for
                    {{ mapStore.selectedCity()?.name }}
                  </p>
                </div>
              }
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class LocationMapPageComponent {
  readonly mapStore = inject(MapStore);

  @ViewChild('mapCanvas') mapCanvas!: MapCanvasComponent;

  private readonly itemsPerPage = 50;
  private readonly currentPage = signal(0);

  readonly visiblePostalCodes = computed(() => {
    const allCodes = this.mapStore.postalCodes();
    const page = this.currentPage();
    return allCodes.slice(0, (page + 1) * this.itemsPerPage);
  });

  readonly hasMore = computed(() => {
    return (
      this.visiblePostalCodes().length < this.mapStore.postalCodes().length
    );
  });

  /**
   * Handle marker clicks - Sync from MAP to TABLE
   */
  onMarkerClick(postalCode: PostalCode): void {
    console.log(
      '🗺️ Marker clicked:',
      postalCode.postalCode,
      postalCode.placeName
    );

    this.mapStore.setActiveMarker(postalCode);

    this.scrollToPostalCode(postalCode);
  }

  /**
   * Handle table row clicks - Sync from TABLE to MAP
   */
  onPostalCodeClick(postalCode: PostalCode): void {
    console.log(
      '📋 Table row clicked:',
      postalCode.postalCode,
      postalCode.placeName
    );

    this.mapStore.setActiveMarker(postalCode);

    if (this.mapCanvas) {
      this.mapCanvas.highlightMarker(postalCode);
    }
  }

  /**
   * Get dynamic CSS classes for table rows based on selection state
   */
  getRowClasses(code: PostalCode): string {
    const isActive = this.mapStore.activeMarker() === code;

    if (isActive) {
      return 'bg-blue-600 hover:bg-blue-500';
    }

    return 'bg-gray-600 hover:bg-gray-500';
  }

  /**
   * Scroll table to show specific postal code (basic implementation)
   */
  private scrollToPostalCode(postalCode: PostalCode): void {
    const allCodes = this.mapStore.postalCodes();
    const index = allCodes.findIndex(
      (code) =>
        code.postalCode === postalCode.postalCode &&
        code.latitude === postalCode.latitude
    );

    if (index !== -1) {
      const currentVisible = this.visiblePostalCodes().length;
      if (index >= currentVisible) {
        const neededPage = Math.floor(index / this.itemsPerPage);
        this.currentPage.set(neededPage);
      }
    }
  }

  onCountryChange(event: Event): void {
    this.resetPagination();
    const target = event.target as HTMLSelectElement;
    const countryCode = target.value;

    if (countryCode) {
      const country = this.mapStore
        .countries()
        .find((c) => c.code === countryCode);
      if (country) {
        this.mapStore.selectCountry(country);
      }
    } else {
      this.mapStore.clearSelection();
    }
  }

  onCityChange(event: Event): void {
    this.resetPagination();
    const target = event.target as HTMLSelectElement;
    const cityName = target.value;

    if (cityName) {
      const city = this.mapStore.cities().find((c) => c.name === cityName);
      if (city) {
        this.mapStore.selectCity(city);
      }
    } else {
      this.mapStore.clearCitySelection();
    }
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const threshold = 100;

    if (
      element.scrollTop + element.clientHeight >=
      element.scrollHeight - threshold
    ) {
      if (this.hasMore()) {
        this.currentPage.update((page) => page + 1);
      }
    }
  }

  trackByPostalCode(index: number, item: any): string {
    return `${item.postalCode}-${item.placeName}-${item.latitude}-${item.longitude}`;
  }

  private resetPagination(): void {
    this.currentPage.set(0);
  }

  goBack(): void {
    window.history.back();
  }
}
