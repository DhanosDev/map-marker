import {
  Component,
  inject,
  signal,
  computed,
  ViewChild,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MapStore } from '../../core/stores/map.store';
import { MapCanvasComponent } from './components/map-canvas.component';
import { PostalCode } from '../../core/models/business.interfaces';
import {
  SearchInputComponent,
  SelectOption,
} from './components/search-input.component';
import { CollapsibleResultsTableComponent } from './components/collapsible-results-table.component';

@Component({
  selector: 'app-location-map-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MapCanvasComponent,
    SearchInputComponent,
    CollapsibleResultsTableComponent,
  ],
  template: `
    <div class="min-h-screen bg-gray-900 text-white">
      <!-- Header -->
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

      <!-- Error State -->
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
          <!-- Map Section -->
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

          <!-- Controls Section -->
          <div class="bg-gray-800 rounded-lg p-4">
            <h2 class="text-lg font-semibold mb-4">Search & Results</h2>

            <!-- Search Input Component -->
            <div class="mb-4">
              @if (!mapStore.hasSelectedCountry()) {
                <!-- Country Selection -->
                <app-search-input
                  type="country"
                  [options]="countryOptions()"
                  placeholder="Seleccionar País"
                  [isLoading]="mapStore.isLoading()"
                  [selectedValue]="mapStore.selectedCountry()?.code || ''"
                  (valueSelected)="onNewCountrySelect($event)"
                ></app-search-input>
              } @else {
                <!-- City Selection -->
                <app-search-input
                  type="city"
                  [options]="cityOptions()"
                  placeholder="Seleccionar Ciudad"
                  [isLoading]="mapStore.isLoading()"
                  [selectedValue]="mapStore.selectedCity()?.name || ''"
                  (valueSelected)="onNewCitySelect($event)"
                ></app-search-input>
              }
            </div>
          </div>
        </div>
      </main>

      <!-- COLLAPSIBLE TABLE - Angular 18 Best Practice Implementation -->
      <app-collapsible-results-table
        [postalCodes]="mapStore.postalCodes()"
        [activeMarker]="mapStore.activeMarker()"
        [isExpanded]="tableExpanded()"
        (rowClicked)="onTableRowClick($event)"
        (expandToggled)="onTableToggle($event)"
      ></app-collapsible-results-table>
    </div>
  `,
})
export class LocationMapPageComponent {
  readonly mapStore = inject(MapStore);

  @ViewChild('mapCanvas') mapCanvas!: MapCanvasComponent;

  // COMPUTED APPROACH: Auto-expand when data exists + manual toggle
  private manualCollapsed = signal(false);

  tableExpanded = computed(() => {
    const hasData = this.mapStore.postalCodes().length > 0;
    return hasData && !this.manualCollapsed();
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
  }

  /**
   * Handle table row clicks - Sync from TABLE to MAP
   */
  onTableRowClick(postalCode: PostalCode): void {
    console.log(
      '📋 Collapsible table row clicked:',
      postalCode.postalCode,
      postalCode.placeName
    );

    // Set active marker
    this.mapStore.setActiveMarker(postalCode);

    // Highlight marker on map
    if (this.mapCanvas) {
      this.mapCanvas.highlightMarker(postalCode);
    }
  }

  /**
   * Handle table expand toggle
   */
  onTableToggle(expanded: boolean): void {
    this.manualCollapsed.set(!expanded);
  }

  countryOptions = computed((): SelectOption[] => {
    return this.mapStore.countries().map((country) => ({
      value: country.code,
      label: `${country.name} (${country.count.toLocaleString()} codes)`,
    }));
  });

  cityOptions = computed((): SelectOption[] => {
    return this.mapStore.cities().map((city) => ({
      value: city.name,
      label: `${city.name} (${city.postalCount.toLocaleString()} codes)`,
    }));
  });

  onNewCountrySelect(countryCode: string): void {
    const country = this.mapStore
      .countries()
      .find((c) => c.code === countryCode);
    if (country) {
      this.mapStore.selectCountry(country);
      // Reset manual collapse when changing data
      this.manualCollapsed.set(false);
    }
  }

  onNewCitySelect(cityName: string): void {
    const city = this.mapStore.cities().find((c) => c.name === cityName);
    if (city) {
      this.mapStore.selectCity(city);
      // Reset manual collapse when changing data
      this.manualCollapsed.set(false);
    }
  }

  goBack(): void {
    window.history.back();
  }
}
