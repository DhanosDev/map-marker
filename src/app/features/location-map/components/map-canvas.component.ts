import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import * as L from 'leaflet';

import { PostalCode } from '../../../core/models/business.interfaces';
import {
  createMarkersGroup,
  MapMarker,
} from '../../../core/utils/map-markers.util';

@Component({
  selector: 'app-map-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div #mapContainer id="map" class="w-full h-full"></div>

      @if (isLoading()) {
        <div
          class="absolute inset-0 bg-gray-900/50 flex items-center justify-center"
        >
          <div class="text-white">Loading map...</div>
        </div>
      }

      @if (mapError()) {
        <div
          class="absolute inset-0 bg-red-900/80 flex items-center justify-center"
        >
          <div class="text-center text-white">
            <p class="mb-2">Map failed to load</p>
            <button
              class="px-3 py-1 bg-red-700 rounded hover:bg-red-600"
              (click)="retryMapInitialization()"
            >
              Retry
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }

      .map-container {
        position: relative;
        height: 400px;
        width: 100%;
        border-radius: 0.5rem;
        overflow: hidden;
      }

      @media (min-width: 768px) {
        .map-container {
          height: 500px;
        }
      }
    `,
  ],
})
export class MapCanvasComponent implements AfterViewInit, OnDestroy {
  // ========================================
  // PUBLIC API - INPUTS & OUTPUTS
  // ========================================

  @Input() postalCodes = signal<PostalCode[]>([]);
  @Output() markerClicked = new EventEmitter<PostalCode>();

  // ========================================
  // COMPONENT STATE - REACTIVE SIGNALS
  // ========================================

  readonly isLoading = signal<boolean>(true);
  readonly mapError = signal<string | null>(null);
  private readonly selectedMarkerId = signal<string | null>(null);

  // ========================================
  // COMPUTED VALUES - DERIVED STATE
  // ========================================

  private readonly markers = computed(() => {
    const codes = this.postalCodes();
    if (!codes || codes.length === 0) {
      return [];
    }

    try {
      return createMarkersGroup(codes);
    } catch (error) {
      console.error('Failed to create markers group:', error);
      return [];
    }
  });

  // ========================================
  // COMPONENT REFERENCES
  // ========================================

  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer!: ElementRef<HTMLElement>;

  // ========================================
  // LEAFLET STATE - MAP MANAGEMENT
  // ========================================

  private map: L.Map | null = null;
  private markersGroup: L.LayerGroup | null = null;
  private currentMarkers: MapMarker[] = [];
  private resizeListener: (() => void) | null = null;

  // ========================================
  // ANGULAR LIFECYCLE
  // ========================================

  constructor() {
    // Effect para reactive marker updates
    effect(() => {
      const newMarkers = this.markers();
      this.updateMapMarkers(newMarkers);
    });
  }

  ngAfterViewInit(): void {
    // Delay para asegurar DOM rendering
    setTimeout(() => {
      this.initializeMap();
    }, 0);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ========================================
  // PUBLIC METHODS - COMPONENT API
  // ========================================

  /**
   * Highlight specific marker on map and center view
   */
  highlightMarker(postalCode: PostalCode): void {
    if (!this.map || !postalCode) {
      console.warn(
        'Cannot highlight marker: map not ready or invalid postal code'
      );
      return;
    }

    const marker = this.findMarkerByPostalCode(postalCode);

    if (marker) {
      this.map.setView([postalCode.latitude, postalCode.longitude], 12);
      marker.marker.openPopup();
      this.selectedMarkerId.set(marker.id);

      console.log('✅ Marker highlighted:', postalCode.postalCode);
    } else {
      console.warn(
        '❌ Marker not found for postal code:',
        postalCode.postalCode
      );
    }
  }

  /**
   * Retry map initialization after error
   */
  retryMapInitialization(): void {
    this.mapError.set(null);
    this.isLoading.set(true);
    this.cleanup();

    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  // ========================================
  // PRIVATE METHODS - MAP MANAGEMENT
  // ========================================

  private initializeMap(): void {
    try {
      this.validateMapContainer();
      this.createMap();
      this.addTileLayer();
      this.setupResponsiveHandling();

      this.isLoading.set(false);
      this.mapError.set(null);

      console.log('✅ Map initialized successfully');
    } catch (error) {
      this.handleMapError('Map initialization failed', error);
    }
  }

  private validateMapContainer(): void {
    if (!this.mapContainer?.nativeElement) {
      throw new Error('Map container element not available');
    }
  }

  private createMap(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [0, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true, // Performance optimization
    });
  }

  private addTileLayer(): void {
    if (!this.map) return;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      tileSize: 256,
      zoomOffset: 0,
      detectRetina: true, // Better display on high-DPI screens
    }).addTo(this.map);
  }

  private setupResponsiveHandling(): void {
    if (!this.map) return;

    // Responsive resize handler
    this.resizeListener = () => {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 100);
    };

    window.addEventListener('resize', this.resizeListener);

    // Mobile-specific initial zoom
    if (window.innerWidth < 768) {
      this.map.setView([0, 0], 1);
    }
  }

  // ========================================
  // PRIVATE METHODS - MARKERS MANAGEMENT
  // ========================================

  private updateMapMarkers(newMarkers: MapMarker[]): void {
    if (!this.map) {
      console.log('⏳ Map not ready, skipping markers update');
      return;
    }

    try {
      this.clearExistingMarkers();
      this.addNewMarkers(newMarkers);
      this.fitMapBounds(newMarkers);

      console.log(`✅ Updated map with ${newMarkers.length} markers`);
    } catch (error) {
      console.error('❌ Failed to update markers:', error);
    }
  }

  private clearExistingMarkers(): void {
    if (this.markersGroup && this.map) {
      this.map.removeLayer(this.markersGroup);
    }
    this.markersGroup = null;
    this.currentMarkers = [];
  }

  private addNewMarkers(newMarkers: MapMarker[]): void {
    if (!newMarkers?.length || !this.map) return;

    this.markersGroup = L.layerGroup();
    this.currentMarkers = newMarkers;

    newMarkers.forEach(({ marker, id, postalCode }) => {
      this.setupMarkerEvents(marker, id, postalCode);
      this.markersGroup!.addLayer(marker);
    });

    this.markersGroup.addTo(this.map);
  }

  private setupMarkerEvents(
    marker: L.Marker,
    id: string,
    postalCode: PostalCode
  ): void {
    marker.on('click', () => {
      this.selectedMarkerId.set(id);
      this.markerClicked.emit(postalCode);
      console.log('🎯 Marker clicked:', postalCode.postalCode);
    });
  }

  private fitMapBounds(markers: MapMarker[]): void {
    if (!markers?.length || !this.map) return;

    try {
      const group = new L.FeatureGroup(markers.map((m) => m.marker));
      this.map.fitBounds(group.getBounds(), {
        padding: [10, 10],
        maxZoom: 10, // Prevent excessive zoom on single markers
      });
    } catch (error) {
      console.warn('Could not fit map bounds:', error);
    }
  }

  // ========================================
  // PRIVATE METHODS - UTILITIES
  // ========================================

  private findMarkerByPostalCode(
    postalCode: PostalCode
  ): MapMarker | undefined {
    return this.currentMarkers.find(
      (marker) =>
        marker.postalCode.postalCode === postalCode.postalCode &&
        marker.postalCode.latitude === postalCode.latitude &&
        marker.postalCode.longitude === postalCode.longitude
    );
  }

  private handleMapError(message: string, error: unknown): void {
    console.error(`❌ ${message}:`, error);
    this.mapError.set(message);
    this.isLoading.set(false);
  }

  private cleanup(): void {
    // Remove event listeners
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }

    // Clean up map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Reset state
    this.markersGroup = null;
    this.currentMarkers = [];
  }
}
