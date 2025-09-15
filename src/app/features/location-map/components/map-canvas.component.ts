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
  inject,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { debounceTime, fromEvent } from 'rxjs';

import * as L from 'leaflet';

import { PostalCode } from '../../../core/models/business.interfaces';
import {
  createMarkersGroup,
  MapMarker,
} from '../../../core/utils/map-markers.util';
import { MapStore } from '../../../core/stores/map.store';

/**
 * Map configuration constants - Centralized for maintainability
 */
const MAP_CONFIG = {
  INITIAL_CENTER: [20, 0] as [number, number],
  INITIAL_ZOOM: 2,
  MIN_ZOOM: 2,
  MAX_ZOOM: 18,
  MARKER_ZOOM: 10,
  INIT_DELAY: 100,
  RESIZE_DEBOUNCE: 250,
  ANIMATION_DURATION: 0.5,
  BOUNDS_PADDING: [20, 20] as [number, number],
} as const;

@Component({
  selector: 'app-map-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #mapContainer id="leaflet-map" class="absolute inset-0 w-full h-full">
      @if (isLoading()) {
        <div
          class="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-50"
          role="status"
          aria-label="Loading map"
        >
          <div class="text-white">Loading map...</div>
        </div>
      }

      @if (mapError()) {
        <div
          class="absolute inset-0 bg-red-900/80 flex items-center justify-center z-50"
          role="alert"
          aria-live="assertive"
        >
          <div class="text-center text-white">
            <p class="mb-2">Map failed to load</p>
            <button
              class="px-3 py-1 bg-red-700 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
              (click)="retryMapInitialization()"
              aria-label="Retry map initialization"
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
        width: 100%;
        height: 100%;
        contain: layout style paint;
      }
    `,
  ],
})
export class MapCanvasComponent implements AfterViewInit, OnDestroy {
  // ============================================
  // COMPONENT API
  // ============================================

  @Input() postalCodes = signal<PostalCode[]>([]);
  @Output() markerClicked = new EventEmitter<PostalCode>();

  // ============================================
  // DEPENDENCY INJECTION
  // ============================================

  private readonly mapStore = inject(MapStore);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================
  // COMPONENT STATE
  // ============================================

  readonly isLoading = signal<boolean>(true);
  readonly mapError = signal<string | null>(null);
  private readonly selectedMarkerId = signal<string | null>(null);

  // ============================================
  // VIEW REFERENCES
  // ============================================

  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer?: ElementRef<HTMLElement>;

  // ============================================
  // MAP INFRASTRUCTURE
  // ============================================

  private map: L.Map | null = null;
  private markersGroup: L.LayerGroup | null = null;
  private currentMarkers: MapMarker[] = [];

  // ============================================
  // PERFORMANCE OPTIMIZATIONS
  // ============================================

  // Memoized icon instances to prevent recreation
  private readonly normalIconCache = new WeakMap<PostalCode, L.Icon>();
  private readonly selectedIconCache = new WeakMap<PostalCode, L.DivIcon>();

  // Debounced update functions
  private pendingMarkerUpdate = false;

  // ============================================
  // REACTIVE COMPUTED PROPERTIES
  // ============================================

  /**
   * Selected marker from store - Optimized computed
   */
  private readonly selectedMarker = computed(() =>
    this.mapStore.activeMarker()
  );

  // ============================================
  // LIFECYCLE & EFFECTS
  // ============================================

  constructor() {
    // Effect: Handle postal codes changes with debouncing
    effect(() => {
      const codes = this.postalCodes();
      if (this.map && !this.pendingMarkerUpdate) {
        this.scheduleMarkerUpdate(codes);
      }
    });

    // Effect: Handle marker selection changes
    effect(() => {
      const activeMarker = this.selectedMarker();
      if (this.map && this.currentMarkers.length > 0) {
        this.updateMarkerSelection(activeMarker);
      }
    });

    // Setup window resize handling with proper cleanup
    this.setupResizeHandler();
  }

  ngAfterViewInit(): void {
    // Delayed initialization to ensure DOM is ready
    setTimeout(() => {
      this.initializeMap();
    }, MAP_CONFIG.INIT_DELAY);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  // ============================================
  // PUBLIC API METHODS
  // ============================================

  /**
   * Highlight specific marker and center map view
   * Public API for parent component interaction
   */
  highlightMarker(postalCode: PostalCode): void {
    if (!this.map || !postalCode) return;

    try {
      const marker = this.findMarkerByPostalCode(postalCode);
      if (marker) {
        const currentCenter = this.map.getCenter();
        const targetLat = postalCode.latitude;
        const targetLng = postalCode.longitude;

        // ✅ Forzar animación con micro-offset si coordenadas son idénticas
        const latDiff = Math.abs(currentCenter.lat - targetLat);
        const lngDiff = Math.abs(currentCenter.lng - targetLng);

        if (latDiff < 0.0001 && lngDiff < 0.0001) {
          // Micro-offset para forzar animación
          this.map.flyTo(
            [targetLat + 0.0001, targetLng + 0.0001],
            MAP_CONFIG.MARKER_ZOOM,
            {
              animate: true,
              duration: MAP_CONFIG.ANIMATION_DURATION / 2,
            }
          );

          setTimeout(
            () => {
              this.map!.flyTo([targetLat, targetLng], MAP_CONFIG.MARKER_ZOOM, {
                animate: true,
                duration: MAP_CONFIG.ANIMATION_DURATION / 2,
              });
            },
            (MAP_CONFIG.ANIMATION_DURATION * 500) / 2
          );
        } else {
          this.map.flyTo([targetLat, targetLng], MAP_CONFIG.MARKER_ZOOM, {
            animate: true,
            duration: MAP_CONFIG.ANIMATION_DURATION,
          });
        }

        marker.marker.openPopup();
        this.selectedMarkerId.set(this.createMarkerId(postalCode));
      }
    } catch (error) {
      console.error('Error highlighting marker:', error);
    }
  }

  /**
   * Retry map initialization after error
   * Public API for error recovery
   */
  retryMapInitialization(): void {
    this.mapError.set(null);
    this.isLoading.set(true);
    this.cleanup();

    setTimeout(() => {
      this.initializeMap();
    }, MAP_CONFIG.INIT_DELAY);
  }

  /**
   * Reset map view to initial coordinates and zoom
   * Part of back navigation functionality
   */
  resetMapView(): void {
    if (!this.map) {
      console.warn('Map not initialized, cannot reset view');
      return;
    }

    try {
      this.map.setView(MAP_CONFIG.INITIAL_CENTER, MAP_CONFIG.INITIAL_ZOOM, {
        animate: true,
        duration: MAP_CONFIG.ANIMATION_DURATION,
      });
      this.map.fitWorld();
    } catch (error) {
      console.error('Error resetting map view:', error);
    }
  }

  /**
   * Clear all markers from map
   * Part of back navigation functionality
   */
  clearAllMarkers(): void {
    try {
      this.clearMarkers();
      this.selectedMarkerId.set(null);
    } catch (error) {
      console.error('Error clearing markers:', error);
    }
  }

  /**
   * Complete reset to initial state
   * Primary method called from parent component
   */
  resetToInitialState(): void {
    this.clearAllMarkers();
    this.resetMapView();
    this.map?.closePopup();
  }

  // ============================================
  // PRIVATE MAP INITIALIZATION
  // ============================================

  private initializeMap(): void {
    try {
      this.validateContainer();
      this.cleanupExistingMap();
      this.createMap();
      this.addTileLayer();

      this.isLoading.set(false);
      this.mapError.set(null);
    } catch (error) {
      this.handleMapError('Map initialization failed', error);
    }
  }

  private validateContainer(): void {
    if (!this.mapContainer?.nativeElement) {
      throw new Error('Map container element not available');
    }
  }

  private cleanupExistingMap(): void {
    const container = this.mapContainer?.nativeElement;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      this.map?.remove();
      this.map = null;
      container.innerHTML = '';
      delete (container as any)._leaflet_id;
    }
  }

  private createMap(): void {
    const container = this.mapContainer?.nativeElement;
    if (!container) return;

    this.map = L.map(container, {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      maxBounds: [
        [-90, -180],
        [90, 180],
      ],
      maxBoundsViscosity: 1.0,
      center: MAP_CONFIG.INITIAL_CENTER,
      zoom: MAP_CONFIG.INITIAL_ZOOM,
      minZoom: MAP_CONFIG.MIN_ZOOM,
      maxZoom: MAP_CONFIG.MAX_ZOOM,
    });

    this.map.fitWorld();
  }

  private addTileLayer(): void {
    if (!this.map) return;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: MAP_CONFIG.MAX_ZOOM,
      tileSize: 256,
      zoomOffset: 0,
    }).addTo(this.map);
  }

  // ============================================
  // PERFORMANCE-OPTIMIZED MARKER MANAGEMENT
  // ============================================

  /**
   * Schedule marker update with debouncing to prevent thrashing
   */
  private scheduleMarkerUpdate(postalCodes: PostalCode[]): void {
    if (this.pendingMarkerUpdate) return;

    this.pendingMarkerUpdate = true;

    // Use microtask to batch updates
    Promise.resolve().then(() => {
      this.updateMarkers(postalCodes);
      this.pendingMarkerUpdate = false;
    });
  }

  /**
   * Optimized marker update - handles incremental changes
   */
  private updateMarkers(postalCodes: PostalCode[]): void {
    if (!this.map) return;

    try {
      this.clearMarkers();

      if (postalCodes.length === 0) return;

      const newMarkers = createMarkersGroup(postalCodes);
      this.addMarkers(newMarkers);
      this.fitMarkerBounds(newMarkers);
    } catch (error) {
      console.error('Failed to update markers:', error);
      this.handleMapError('Marker update failed', error);
    }
  }

  private updateMarkerSelection(activeMarker: PostalCode | null): void {
    if (!this.currentMarkers.length) return;

    this.currentMarkers.forEach(({ marker, postalCode }) => {
      const isSelected = activeMarker
        ? this.comparePostalCodes(activeMarker, postalCode)
        : false;
      this.updateMarkerIcon(marker, postalCode, isSelected);
    });
  }

  private updateMarkerIcon(
    marker: L.Marker,
    postalCode: PostalCode,
    isSelected: boolean
  ): void {
    const icon = isSelected
      ? this.getOrCreateSelectedIcon(postalCode)
      : this.getOrCreateNormalIcon(postalCode);
    marker.setIcon(icon);
  }

  // ============================================
  // MEMOIZED ICON CREATION
  // ============================================

  private getOrCreateNormalIcon(postalCode: PostalCode): L.Icon {
    if (this.normalIconCache.has(postalCode)) {
      return this.normalIconCache.get(postalCode)!;
    }

    const icon = this.createNormalIcon();
    this.normalIconCache.set(postalCode, icon);
    return icon;
  }

  private getOrCreateSelectedIcon(postalCode: PostalCode): L.DivIcon {
    if (this.selectedIconCache.has(postalCode)) {
      return this.selectedIconCache.get(postalCode)!;
    }

    const icon = this.createSelectedIcon();
    this.selectedIconCache.set(postalCode, icon);
    return icon;
  }

  private createNormalIcon(): L.Icon {
    return L.icon({
      iconUrl:
        'data:image/svg+xml;base64,' +
        btoa(`
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="9.96539" cy="9.96539" r="9.96539" fill="white"/>
          <circle cx="9.96563" cy="9.9651" r="6.6436" fill="#FF0000"/>
        </svg>
      `),
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -10],
    });
  }

  private createSelectedIcon(): L.DivIcon {
    return L.divIcon({
      className: 'selected-marker-container',
      html: `
        <div class="marker-selected">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9.96539" cy="9.96539" r="9.96539" fill="white"/>
            <circle cx="9.96563" cy="9.9651" r="6.6436" fill="#68E9CF"/>
          </svg>
          <div class="pulse-ring"></div>
          <div class="pulse-ring pulse-ring-delay"></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  // ============================================
  // MARKER LIFECYCLE MANAGEMENT
  // ============================================

  private clearMarkers(): void {
    if (this.markersGroup && this.map) {
      this.map.removeLayer(this.markersGroup);
    }
    this.markersGroup = null;
    this.currentMarkers = [];
  }

  private addMarkers(newMarkers: MapMarker[]): void {
    if (!newMarkers?.length || !this.map) return;

    this.markersGroup = L.layerGroup();
    this.currentMarkers = newMarkers;

    newMarkers.forEach(({ marker, postalCode }) => {
      this.setupMarkerEvents(marker, postalCode);
      this.markersGroup!.addLayer(marker);
    });

    this.markersGroup.addTo(this.map);
  }

  private setupMarkerEvents(marker: L.Marker, postalCode: PostalCode): void {
    marker.on('click', (e) => {
      e.originalEvent?.stopPropagation();

      // Update map view
      this.map?.setView(
        [postalCode.latitude, postalCode.longitude],
        MAP_CONFIG.MARKER_ZOOM,
        { animate: true, duration: MAP_CONFIG.ANIMATION_DURATION }
      );

      // Update store state
      this.mapStore.setActiveMarker(postalCode);

      // Emit to parent
      this.markerClicked.emit(postalCode);
    });
  }

  private fitMarkerBounds(markers: MapMarker[]): void {
    if (!markers?.length || !this.map) return;

    try {
      const group = new L.FeatureGroup(markers.map((m) => m.marker));
      this.map.fitBounds(group.getBounds(), {
        padding: MAP_CONFIG.BOUNDS_PADDING,
        maxZoom: MAP_CONFIG.MARKER_ZOOM,
      });
    } catch (error) {
      console.warn('Could not fit marker bounds:', error);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private findMarkerByPostalCode(
    postalCode: PostalCode
  ): MapMarker | undefined {
    return this.currentMarkers.find((marker) =>
      this.comparePostalCodes(marker.postalCode, postalCode)
    );
  }

  private comparePostalCodes(a: PostalCode, b: PostalCode): boolean {
    return (
      a.postalCode === b.postalCode &&
      a.latitude === b.latitude &&
      a.longitude === b.longitude
    );
  }

  private createMarkerId(postalCode: PostalCode): string {
    return `${postalCode.postalCode}-${postalCode.latitude}-${postalCode.longitude}`;
  }

  // ============================================
  // ERROR HANDLING
  // ============================================

  private handleMapError(message: string, error: unknown): void {
    console.error(`${message}:`, error);
    this.mapError.set(message);
    this.isLoading.set(false);
  }

  // ============================================
  // MEMORY MANAGEMENT & CLEANUP
  // ============================================

  private setupResizeHandler(): void {
    if (typeof window === 'undefined') return;

    fromEvent(window, 'resize')
      .pipe(
        debounceTime(MAP_CONFIG.RESIZE_DEBOUNCE),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.map?.invalidateSize();
      });
  }

  private cleanup(): void {
    // Cleanup map instance
    this.map?.remove();
    this.map = null;

    // Clear references
    this.markersGroup = null;
    this.currentMarkers = [];

    // Reset state
    this.selectedMarkerId.set(null);
  }
}
