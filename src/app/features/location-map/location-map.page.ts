import {
  Component,
  inject,
  signal,
  computed,
  ViewChild,
  DestroyRef,
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
      <!-- SKIP LINK for keyboard navigation -->
      <a
        href="#main-controls"
        class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-blue-600 focus:text-white focus:px-3 focus:py-2 focus:rounded focus:no-underline"
      >
        Skip to main controls
      </a>

      <!-- MAP BACKGROUND (z-10) -->
      <app-map-canvas
        #mapCanvas
        class="absolute inset-0 z-10 h-screen w-screen"
        [postalCodes]="mapStore.postalCodes"
        (markerClicked)="onMarkerClick($event)"
        aria-label="Interactive map showing postal code locations"
      ></app-map-canvas>

      <!-- Hidden description for screen readers -->
      @if (mapStore.hasSelectedCountry()) {
        <div id="map-description" class="sr-only">
          Map showing {{ mapStore.postalCodes().length }} postal codes for
          {{ mapStore.selectedCountry()?.name }}
          @if (mapStore.selectedCity()) {
            in {{ mapStore.selectedCity()?.name }}
          }
        </div>
      }

      <!-- HEADER OVERLAY (z-40) -->
      <header
        class="fixed top-0 left-0 right-0 z-40 bg-transparent"
        role="banner"
      >
        <div class="flex items-center justify-between px-7 pt-4 pb-2">
          @if (mapStore.selectedCountry()) {
            <button
              class="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer back-button-neumorphism"
              (click)="onBackClick()"
              (keydown.enter)="onBackClick()"
              (keydown.space)="onBackClick()"
              tabindex="0"
              role="button"
              aria-label="Return to country selection"
            >
              <svg
                width="10"
                height="16"
                viewBox="0 0 10 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="back-button-icon"
                aria-hidden="true"
              >
                <path
                  d="M0.511718 8C0.520507 8.30762 0.634765 8.58887 0.880859 8.81738L7.71875 15.4971C7.91211 15.6904 8.1582 15.7959 8.44824 15.7959C9.02832 15.7959 9.49414 15.3389 9.49414 14.7588C9.49414 14.4775 9.37988 14.2051 9.17773 14.0029L3.0166 8.00879L9.17773 1.99707C9.37109 1.79492 9.49414 1.53125 9.49414 1.24121C9.49414 0.661133 9.02832 0.204102 8.44824 0.204102C8.1582 0.204102 7.91211 0.30957 7.71875 0.50293L0.880859 7.19141C0.634765 7.42871 0.511718 7.69238 0.511718 8Z"
                />
              </svg>
            </button>
          }

          <h1
            class="text-white font-bold text-center flex-1 font-roboto text-[25px] tracking-[-0.3px]"
            role="heading"
            aria-level="1"
          >
            {{ mapStore.selectedCountry()?.name || 'Ubicación' }}
          </h1>

          @if (mapStore.selectedCountry()) {
            <div class="w-11" aria-hidden="true"></div>
          }
        </div>
      </header>

      <!-- SEARCH OVERLAY (z-60) -->
      <div
        class="fixed left-0 right-0 top-16 px-7 pt-[14px] z-[60]"
        id="main-controls"
      >
        @if (!mapStore.hasSelectedCountry()) {
          <app-search-input
            type="country"
            [options]="countryOptions()"
            placeholder="Seleccionar País"
            [isLoading]="mapStore.isLoading()"
            [selectedValue]="mapStore.selectedCountry()?.code || ''"
            (valueSelected)="onNewCountrySelect($event)"
            aria-label="Select a country to view postal codes"
          ></app-search-input>
        } @else {
          <app-search-input
            type="city"
            [options]="cityOptions()"
            placeholder="Seleccionar Ciudad"
            [isLoading]="mapStore.isLoading()"
            [selectedValue]="mapStore.selectedCity()?.name || ''"
            (valueSelected)="onNewCitySelect($event)"
            aria-label="Select a city to view postal codes"
          ></app-search-input>
        }
      </div>

      <!-- ERROR OVERLAY (z-70) -->
      @if (mapStore.error()) {
        <div
          class="fixed inset-0 flex items-center justify-center z-[70] bg-black bg-opacity-50"
          role="alert"
          aria-live="assertive"
        >
          <div
            class="bg-red-900 border border-red-700 rounded-lg p-6 mx-4 max-w-sm"
            role="alertdialog"
            aria-labelledby="error-title"
            aria-describedby="error-message"
          >
            <h2 id="error-title" class="sr-only">Error</h2>
            <p id="error-message" class="text-red-200 mb-4">
              {{ mapStore.error() }}
            </p>
            <button
              class="w-full bg-red-700 hover:bg-red-600 px-4 py-2 rounded transition-colors text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-400"
              (click)="mapStore.loadCountries()"
              aria-label="Retry loading data"
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
        aria-label="Postal codes results"
      ></app-collapsible-results-table>
    </div>
  `,
})
export class LocationMapPageComponent {
  // ============================================
  // DEPENDENCY INJECTION
  // ============================================

  readonly mapStore = inject(MapStore);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================
  // VIEW REFERENCES
  // ============================================

  @ViewChild('mapCanvas') mapCanvas?: MapCanvasComponent;

  // ============================================
  // REACTIVE STATE
  // ============================================

  private readonly manualCollapsed = signal(false);

  /**
   * Table expansion state - combines data availability with user preference
   */
  readonly tableExpanded = computed(() => {
    const hasData = this.mapStore.postalCodes().length > 0;
    return hasData && !this.manualCollapsed();
  });

  // ============================================
  // COMPUTED PROPERTIES (Memoized for Performance)
  // ============================================

  /**
   * Country options for dropdown - Optimized with memoization
   */
  readonly countryOptions = computed((): SelectOption[] => {
    const countries = this.mapStore.countries();

    // Early return for empty state
    if (countries.length === 0) return [];

    return countries.map((country) => ({
      value: country.code,
      label: `${country.name} (${this.formatCount(country.count)} codes)`,
    }));
  });

  /**
   * City options for dropdown - Optimized with memoization
   */
  readonly cityOptions = computed((): SelectOption[] => {
    const cities = this.mapStore.cities();

    // Early return for empty state
    if (cities.length === 0) return [];

    return cities.map((city) => ({
      value: city.name,
      label: `${city.name} (${this.formatCount(city.postalCount)} codes)`,
    }));
  });

  // ============================================
  // USER INTERACTION HANDLERS
  // ============================================

  /**
   * Handle back button click - Complete state reset
   * Error handling: Comprehensive try/catch with graceful degradation
   * Accessibility: Screen reader announcements
   */
  onBackClick(): void {
    try {
      // 1. Clear MapStore state completely
      this.mapStore.clearSelection();

      // 2. Reset local UI state
      this.manualCollapsed.set(false);

      // 3. Reset physical map to initial state (null-safe)
      this.mapCanvas?.resetToInitialState();

      // 4. Announce state change for screen readers
      this.announceStateChange('Selection cleared, returned to map overview');
    } catch (error) {
      console.error('Error during back navigation:', error);

      // Graceful degradation - ensure core functionality works
      this.mapStore.clearSelection();
      this.manualCollapsed.set(false);

      // Attempt map reset with additional error handling
      try {
        this.mapCanvas?.resetToInitialState();
      } catch (mapError) {
        console.error('Map reset failed:', mapError);
      }
    }
  }

  /**
   * Handle marker click from map canvas
   * Simple delegation to store - no additional logic needed
   */
  onMarkerClick(postalCode: PostalCode): void {
    this.mapStore.setActiveMarker(postalCode);
  }

  /**
   * Handle table row click - Set active marker and highlight on map
   * Dual action: Store update + map visual feedback
   */
  onTableRowClick(postalCode: PostalCode): void {
    this.mapStore.setActiveMarker(postalCode);
    this.mapCanvas?.highlightMarker(postalCode);
  }

  /**
   * Handle table toggle - Inverse logic for expansion state
   */
  onTableToggle(expanded: boolean): void {
    this.manualCollapsed.set(!expanded);
  }

  /**
   * Handle country selection - Find and select country object
   * Error handling: Validates country exists before selection
   */
  onNewCountrySelect(countryCode: string): void {
    const country = this.mapStore
      .countries()
      .find((c) => c.code === countryCode);

    if (country) {
      this.mapStore.selectCountry(country);
      this.manualCollapsed.set(false);
    } else {
      console.warn(`Country not found: ${countryCode}`);
    }
  }

  /**
   * Handle city selection - Find and select city object
   * Error handling: Validates city exists before selection
   */
  onNewCitySelect(cityName: string): void {
    const city = this.mapStore.cities().find((c) => c.name === cityName);

    if (city) {
      this.mapStore.selectCity(city);
      this.manualCollapsed.set(false);
    } else {
      console.warn(`City not found: ${cityName}`);
    }
  }

  // ============================================
  // PRIVATE UTILITY METHODS
  // ============================================

  /**
   * Format numbers for display - Performance optimized
   */
  private readonly numberFormatter = new Intl.NumberFormat('en-US');

  private formatCount(count: number): string {
    return this.numberFormatter.format(count);
  }

  /**
   * Announce state changes to screen readers
   * Accessibility: ARIA live regions for dynamic content
   * Memory management: Automatic cleanup to prevent leaks
   */
  private announceStateChange(message: string): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className =
      'sr-only absolute -left-10000px w-1px h-1px overflow-hidden';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Automatic cleanup to prevent memory leaks
    setTimeout(() => {
      try {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      } catch (error) {
        // Silently handle cleanup errors
      }
    }, 1000);
  }
}
