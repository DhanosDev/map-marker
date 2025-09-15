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
    <div class="h-screen overflow-hidden relative">
      <!-- MAP BACKGROUND (z-10) -->
      <app-map-canvas
        #mapCanvas
        class="absolute inset-0 z-10 h-screen w-screen"
        [postalCodes]="mapStore.postalCodes"
        (markerClicked)="onMarkerClick($event)"
      ></app-map-canvas>

      <!-- HEADER OVERLAY (z-40) -->
      <header class="fixed top-0 left-0 right-0 z-40 bg-transparent">
        <div class="flex items-center justify-between px-7 pt-4 pb-2">
          @if (mapStore.selectedCountry()) {
            <button
              class="w-11 h-11 rounded-full bg-transparent flex items-center justify-center cursor-pointer shadow-[0_-20px_50px_rgba(43,52,69,0.5),0_20px_30px_rgba(16,20,28,1.0)] border border-white border-opacity-20"
              (click)="onBackClick()"
              aria-label="Go back"
            >
              <svg
                width="10"
                height="16"
                viewBox="0 0 10 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0.511718 8C0.520507 8.30762 0.634765 8.58887 0.880859 8.81738L7.71875 15.4971C7.91211 15.6904 8.1582 15.7959 8.44824 15.7959C9.02832 15.7959 9.49414 15.3389 9.49414 14.7588C9.49414 14.4775 9.37988 14.2051 9.17773 14.0029L3.0166 8.00879L9.17773 1.99707C9.37109 1.79492 9.49414 1.53125 9.49414 1.24121C9.49414 0.661133 9.02832 0.204102 8.44824 0.204102C8.1582 0.204102 7.91211 0.30957 7.71875 0.50293L0.880859 7.19141C0.634765 7.42871 0.511718 7.69238 0.511718 8Z"
                  fill="white"
                />
              </svg>
            </button>
          }

          <h1
            class="text-white font-bold text-center flex-1 font-roboto text-[25px] tracking-[-0.3px]"
          >
            {{ mapStore.selectedCountry()?.name || 'Ubicación' }}
          </h1>

          @if (mapStore.selectedCountry()) {
            <div class="w-11"></div>
          }
        </div>
      </header>

      <!-- SEARCH OVERLAY (z-60) -->
      <div class="fixed left-0 right-0 top-16 px-7 pt-[14px] z-[60]">
        @if (!mapStore.hasSelectedCountry()) {
          <app-search-input
            type="country"
            [options]="countryOptions()"
            placeholder="Seleccionar País"
            [isLoading]="mapStore.isLoading()"
            [selectedValue]="mapStore.selectedCountry()?.code || ''"
            (valueSelected)="onNewCountrySelect($event)"
          ></app-search-input>
        } @else {
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

      <!-- ERROR OVERLAY (z-70) -->
      @if (mapStore.error()) {
        <div
          class="fixed inset-0 flex items-center justify-center z-[70] bg-black bg-opacity-50"
        >
          <div
            class="bg-red-900 border border-red-700 rounded-lg p-6 mx-4 max-w-sm"
          >
            <p class="text-red-200 mb-4">{{ mapStore.error() }}</p>
            <button
              class="w-full bg-red-700 hover:bg-red-600 px-4 py-2 rounded transition-colors text-white font-medium"
              (click)="mapStore.loadCountries()"
            >
              Retry
            </button>
          </div>
        </div>
      }

      <!-- TABLE OVERLAY (z-50) -->
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

  private manualCollapsed = signal(false);

  tableExpanded = computed(() => {
    const hasData = this.mapStore.postalCodes().length > 0;
    return hasData && !this.manualCollapsed();
  });

  onBackClick(): void {
    this.mapStore.clearSelection();
    this.manualCollapsed.set(false);
  }

  onMarkerClick(postalCode: PostalCode): void {
    this.mapStore.setActiveMarker(postalCode);
  }

  onTableRowClick(postalCode: PostalCode): void {
    this.mapStore.setActiveMarker(postalCode);

    if (this.mapCanvas) {
      this.mapCanvas.highlightMarker(postalCode);
    }
  }

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
      this.manualCollapsed.set(false);
    }
  }

  onNewCitySelect(cityName: string): void {
    const city = this.mapStore.cities().find((c) => c.name === cityName);
    if (city) {
      this.mapStore.selectCity(city);
      this.manualCollapsed.set(false);
    }
  }
}
