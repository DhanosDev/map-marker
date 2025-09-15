import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef, signal } from '@angular/core';
import { By } from '@angular/platform-browser';

import { MapCanvasComponent } from './map-canvas.component';
import { MapStore } from '../../../core/stores/map.store';
import { PostalCode } from '../../../core/models/business.interfaces';

// Mock Leaflet
const mockLeaflet = {
  map: jasmine.createSpy('map').and.returnValue({
    setView: jasmine.createSpy('setView'),
    fitWorld: jasmine.createSpy('fitWorld'),
    remove: jasmine.createSpy('remove'),
    addTo: jasmine.createSpy('addTo'),
    removeLayer: jasmine.createSpy('removeLayer'),
    fitBounds: jasmine.createSpy('fitBounds'),
    invalidateSize: jasmine.createSpy('invalidateSize'),
    closePopup: jasmine.createSpy('closePopup'),
    on: jasmine.createSpy('on'),
  }),
  tileLayer: jasmine.createSpy('tileLayer').and.returnValue({
    addTo: jasmine.createSpy('addTo'),
  }),
  layerGroup: jasmine.createSpy('layerGroup').and.returnValue({
    addLayer: jasmine.createSpy('addLayer'),
    addTo: jasmine.createSpy('addTo'),
  }),
  FeatureGroup: jasmine.createSpy('FeatureGroup').and.returnValue({
    getBounds: jasmine.createSpy('getBounds').and.returnValue({
      isValid: () => true,
    }),
  }),
  icon: jasmine.createSpy('icon').and.returnValue({}),
  divIcon: jasmine.createSpy('divIcon').and.returnValue({}),
  marker: jasmine.createSpy('marker').and.returnValue({
    on: jasmine.createSpy('on'),
    setIcon: jasmine.createSpy('setIcon'),
    openPopup: jasmine.createSpy('openPopup'),
  }),
};

// Mock the Leaflet module
(window as any).L = mockLeaflet;

describe('MapCanvasComponent', () => {
  let component: MapCanvasComponent;
  let fixture: ComponentFixture<MapCanvasComponent>;
  let mockMapStore: jasmine.SpyObj<MapStore>;

  const mockPostalCodes: PostalCode[] = [
    {
      postalCode: '12345',
      placeName: 'New York',
      countryCode: 'US',
      latitude: 40.7128,
      longitude: -74.006,
      region: 'New York',
      regionCode: 'NY',
      department: 'New York County',
      departmentCode: '061',
      subRegion: '',
      subRegionCode: '',
      accuracy: 4,
    },
    {
      postalCode: '67890',
      placeName: 'Los Angeles',
      countryCode: 'US',
      latitude: 34.0522,
      longitude: -118.2437,
      region: 'California',
      regionCode: 'CA',
      department: 'Los Angeles County',
      departmentCode: '037',
      subRegion: '',
      subRegionCode: '',
      accuracy: 4,
    },
  ];

  beforeEach(async () => {
    // Mock MapStore
    mockMapStore = jasmine.createSpyObj('MapStore', ['setActiveMarker'], {
      activeMarker: signal(null),
    });

    await TestBed.configureTestingModule({
      imports: [MapCanvasComponent],
      providers: [{ provide: MapStore, useValue: mockMapStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(MapCanvasComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
      expect(component.isLoading()).toBe(true);
    });

    it('should have no map error initially', () => {
      expect(component.mapError()).toBeNull();
    });

    it('should render loading indicator when loading', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const loadingElement = fixture.debugElement.query(
        By.css('[role="status"]')
      );
      expect(loadingElement).toBeTruthy();
      expect(loadingElement.nativeElement.textContent).toContain('Loading map');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when map fails to load', () => {
      component.mapError.set('Map initialization failed');
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[role="alert"]'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent).toContain(
        'Map failed to load'
      );
    });

    it('should have retry button when error occurs', () => {
      component.mapError.set('Map initialization failed');
      fixture.detectChanges();

      const retryButton = fixture.debugElement.query(
        By.css('button[aria-label="Retry map initialization"]')
      );
      expect(retryButton).toBeTruthy();
    });

    it('should call retryMapInitialization when retry button is clicked', () => {
      spyOn(component, 'retryMapInitialization');
      component.mapError.set('Map initialization failed');
      fixture.detectChanges();

      const retryButton = fixture.debugElement.query(
        By.css('button[aria-label="Retry map initialization"]')
      );
      retryButton.nativeElement.click();

      expect(component.retryMapInitialization).toHaveBeenCalled();
    });
  });

  describe('Postal Codes Input', () => {
    it('should accept postal codes input', () => {
      component.postalCodes.set(mockPostalCodes);
      expect(component.postalCodes()).toEqual(mockPostalCodes);
    });

    it('should handle empty postal codes array', () => {
      component.postalCodes.set([]);
      expect(component.postalCodes()).toEqual([]);
    });
  });

  describe('Marker Events', () => {
    it('should emit markerClicked event', () => {
      spyOn(component.markerClicked, 'emit');
      const testPostalCode = mockPostalCodes[0];

      // Simulate marker click
      component.markerClicked.emit(testPostalCode);

      expect(component.markerClicked.emit).toHaveBeenCalledWith(testPostalCode);
    });
  });

  describe('Public API Methods', () => {
    it('should handle retry map initialization', () => {
      component.retryMapInitialization();

      expect(component.mapError()).toBeNull();
      expect(component.isLoading()).toBe(true);
    });

    it('should call clearAllMarkers method', () => {
      spyOn(component, 'clearAllMarkers').and.callThrough();
      component.clearAllMarkers();
      expect(component.clearAllMarkers).toHaveBeenCalled();
    });

    it('should call resetMapView method', () => {
      spyOn(component, 'resetMapView').and.callThrough();
      component.resetMapView();
      expect(component.resetMapView).toHaveBeenCalled();
    });

    it('should call resetToInitialState method', () => {
      spyOn(component, 'resetToInitialState').and.callThrough();
      component.resetToInitialState();
      expect(component.resetToInitialState).toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should handle ngOnDestroy without errors', () => {
      // Set map to null to avoid cleanup errors in tests
      (component as any).map = null;

      expect(() => {
        component.ngOnDestroy();
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for loading state', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const loadingElement = fixture.debugElement.query(
        By.css('[role="status"]')
      );
      expect(loadingElement.nativeElement.getAttribute('aria-label')).toBe(
        'Loading map'
      );
    });

    it('should have proper ARIA attributes for error state', () => {
      component.mapError.set('Error occurred');
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[role="alert"]'));
      expect(errorElement.nativeElement.getAttribute('aria-live')).toBe(
        'assertive'
      );
    });

    it('should have accessible retry button', () => {
      component.mapError.set('Error occurred');
      fixture.detectChanges();

      const retryButton = fixture.debugElement.query(
        By.css('button[aria-label="Retry map initialization"]')
      );
      expect(retryButton.nativeElement.getAttribute('aria-label')).toBe(
        'Retry map initialization'
      );
    });
  });

  describe('Template Rendering', () => {
    it('should render map container', () => {
      const mapContainer = fixture.debugElement.query(By.css('#leaflet-map'));
      expect(mapContainer).toBeTruthy();
    });

    it('should not show loading when not loading', () => {
      component.isLoading.set(false);
      fixture.detectChanges();

      const loadingElement = fixture.debugElement.query(
        By.css('[role="status"]')
      );
      expect(loadingElement).toBeFalsy();
    });

    it('should not show error when no error', () => {
      component.mapError.set(null);
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('[role="alert"]'));
      expect(errorElement).toBeFalsy();
    });
  });
});
