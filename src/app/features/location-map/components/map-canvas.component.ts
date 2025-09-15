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
} from '@angular/core';
import { CommonModule } from '@angular/common';

import * as L from 'leaflet';

import { PostalCode } from '../../../core/models/business.interfaces';
import {
  createMarkersGroup,
  MapMarker,
} from '../../../core/utils/map-markers.util';
import { MapStore } from '../../../core/stores/map.store';

@Component({
  selector: 'app-map-canvas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div #mapContainer id="leaflet-map" class="absolute inset-0 w-full h-full">
      @if (isLoading()) {
        <div
          class="absolute inset-0 bg-gray-900/50 flex items-center justify-center z-50"
        >
          <div class="text-white">Loading map...</div>
        </div>
      }

      @if (mapError()) {
        <div
          class="absolute inset-0 bg-red-900/80 flex items-center justify-center z-50"
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
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class MapCanvasComponent implements AfterViewInit, OnDestroy {
  @Input() postalCodes = signal<PostalCode[]>([]);
  @Output() markerClicked = new EventEmitter<PostalCode>();

  private readonly mapStore = inject(MapStore);

  readonly isLoading = signal<boolean>(true);
  readonly mapError = signal<string | null>(null);
  private readonly selectedMarkerId = signal<string | null>(null);

  private readonly postalCodesData = computed(() => this.postalCodes());
  private readonly selectedMarker = computed(() =>
    this.mapStore.activeMarker()
  );

  @ViewChild('mapContainer', { static: true })
  private readonly mapContainer!: ElementRef<HTMLElement>;

  private map: L.Map | null = null;
  private markersGroup: L.LayerGroup | null = null;
  private currentMarkers: MapMarker[] = [];

  constructor() {
    effect(() => {
      const codes = this.postalCodesData();
      if (this.map && codes.length > 0) {
        this.recreateMarkers(codes);
      }
    });

    effect(() => {
      const activeMarker = this.selectedMarker();
      if (this.map && this.currentMarkers.length > 0) {
        this.updateMarkerSelection(activeMarker);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  highlightMarker(postalCode: PostalCode): void {
    if (!this.map || !postalCode) {
      console.warn(
        'Cannot highlight marker: map not ready or invalid postal code'
      );
      return;
    }

    const marker = this.findMarkerByPostalCode(postalCode);
    if (marker) {
      this.map.setView([postalCode.latitude, postalCode.longitude], 10);

      marker.marker.openPopup();

      const markerId = `${postalCode.postalCode}-${postalCode.latitude}-${postalCode.longitude}`;
      this.selectedMarkerId.set(markerId);
    }
  }

  retryMapInitialization(): void {
    this.mapError.set(null);
    this.isLoading.set(true);
    this.cleanup();

    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  private initializeMap(): void {
    try {
      this.validateContainer();
      this.cleanupExistingMap();
      this.createMap();
      this.addTileLayer();
      this.setupMapEvents();

      this.isLoading.set(false);
      this.mapError.set(null);

      console.log('Map initialized successfully');
    } catch (error) {
      this.handleMapError('Map initialization failed', error);
    }
  }

  private validateContainer(): void {
    const container = this.mapContainer?.nativeElement;
    if (!container) {
      throw new Error('Map container element not available');
    }
  }

  private cleanupExistingMap(): void {
    const container = this.mapContainer.nativeElement;

    if (container && (container as any)._leaflet_id) {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      container.innerHTML = '';
      delete (container as any)._leaflet_id;
    }
  }

  private createMap(): void {
    const container = this.mapContainer.nativeElement;

    this.map = L.map(container, {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      maxBounds: [
        [-90, -180],
        [90, 180],
      ],
      maxBoundsViscosity: 1.0,
      center: [20, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 18,
    });

    this.map.fitWorld();
  }

  private addTileLayer(): void {
    if (!this.map) return;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
      tileSize: 256,
      zoomOffset: 0,
    }).addTo(this.map);
  }

  private setupMapEvents(): void {
    if (!this.map) return;

    const resizeHandler = () => {
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 100);
    };

    window.addEventListener('resize', resizeHandler);
    (this.map as any)._resizeHandler = resizeHandler;
  }

  private recreateMarkers(postalCodes: PostalCode[]): void {
    if (!this.map) return;

    try {
      this.clearMarkers();

      if (postalCodes.length === 0) return;

      const newMarkers = createMarkersGroup(postalCodes);
      this.addMarkers(newMarkers);
      this.fitMarkerBounds(newMarkers);
    } catch (error) {
      console.error('Failed to recreate markers:', error);
    }
  }

  private updateMarkerSelection(activeMarker: PostalCode | null): void {
    if (!this.currentMarkers.length) return;

    this.currentMarkers.forEach(({ marker, postalCode }) => {
      const isSelected =
        activeMarker &&
        activeMarker.postalCode === postalCode.postalCode &&
        activeMarker.latitude === postalCode.latitude &&
        activeMarker.longitude === postalCode.longitude;

      this.updateMarkerIcon(marker, postalCode, isSelected || false);
    });
  }

  private updateMarkerIcon(
    marker: L.Marker,
    postalCode: PostalCode,
    isSelected: boolean
  ): void {
    const icon = isSelected
      ? this.createSelectedIcon()
      : this.createNormalIcon();
    marker.setIcon(icon);
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
      marker.on('click', (e) => {
        e.originalEvent?.stopPropagation();

        if (this.map) {
          this.map.setView([postalCode.latitude, postalCode.longitude], 10);
        }

        this.mapStore.setActiveMarker(postalCode);

        this.markerClicked.emit(postalCode);
      });

      this.markersGroup!.addLayer(marker);
    });

    this.markersGroup.addTo(this.map);
  }

  private fitMarkerBounds(markers: MapMarker[]): void {
    if (!markers?.length || !this.map) return;

    try {
      const group = new L.FeatureGroup(markers.map((m) => m.marker));
      this.map.fitBounds(group.getBounds(), {
        padding: [20, 20],
        maxZoom: 10,
      });
    } catch (error) {
      console.warn('Could not fit marker bounds:', error);
    }
  }

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
    console.error(`${message}:`, error);
    this.mapError.set(message);
    this.isLoading.set(false);
  }

  private cleanup(): void {
    if (this.map && (this.map as any)._resizeHandler) {
      window.removeEventListener('resize', (this.map as any)._resizeHandler);
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.markersGroup = null;
    this.currentMarkers = [];
  }
}
