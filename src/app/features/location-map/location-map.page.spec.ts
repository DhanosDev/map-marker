import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { LocationMapPageComponent } from './location-map.page';
import { MapStore } from '../../core/stores/map.store';
import { PostalCodeService } from '../../core/api/postal-code.service';
import {
  Country,
  PostalCode,
  City,
} from '../../core/models/business.interfaces';
import { MapCanvasComponent } from './components/map-canvas.component';
import { SearchInputComponent } from './components/search-input.component';
import { CollapsibleResultsTableComponent } from './components/collapsible-results-table.component';

// Mock data for testing
const mockCountry: Country = {
  code: 'US',
  name: 'United States',
  count: 1000,
};

const mockCity: City = {
  name: 'New York',
  postalCount: 50,
  countryCode: 'US',
};

const mockPostalCode: PostalCode = {
  postalCode: '10001',
  placeName: 'New York',
  countryCode: 'US',
  latitude: 40.7128,
  longitude: -74.006,
  region: 'New York',
  regionCode: 'NY',
  department: 'New York County',
  departmentCode: '061',
  subRegion: 'Manhattan',
  subRegionCode: '001',
  accuracy: 1,
};

// Mock MapStore
class MockMapStore {
  countries = signal<Country[]>([mockCountry]);
  selectedCountry = signal<Country | null>(null);
  cities = signal<City[]>([mockCity]);
  selectedCity = signal<City | null>(null);
  postalCodes = signal<PostalCode[]>([mockPostalCode]);
  activeMarker = signal<PostalCode | null>(null);
  searchQuery = signal<string>('');

  isLoading = signal(false);
  error = signal<string | null>(null);

  hasSelectedCountry = signal(false);
  hasSelectedCity = signal(false);

  selectCountry = jasmine.createSpy('selectCountry');
  selectCity = jasmine.createSpy('selectCity');
  setActiveMarker = jasmine.createSpy('setActiveMarker');
  clearSelection = jasmine.createSpy('clearSelection');
  loadCountries = jasmine.createSpy('loadCountries');
}

// Mock PostalCodeService
class MockPostalCodeService {
  isLoading = signal(false);
  error = signal<string | null>(null);
}

// Mock MapCanvasComponent
class MockMapCanvasComponent {
  highlightMarker = jasmine.createSpy('highlightMarker');
  resetToInitialState = jasmine.createSpy('resetToInitialState');
}

describe('LocationMapPageComponent', () => {
  let component: LocationMapPageComponent;
  let fixture: ComponentFixture<LocationMapPageComponent>;
  let mockMapStore: MockMapStore;
  let mockPostalCodeService: MockPostalCodeService;

  beforeEach(async () => {
    mockMapStore = new MockMapStore();
    mockPostalCodeService = new MockPostalCodeService();

    await TestBed.configureTestingModule({
      imports: [
        LocationMapPageComponent,
        MapCanvasComponent,
        SearchInputComponent,
        CollapsibleResultsTableComponent,
      ],
      providers: [
        { provide: MapStore, useValue: mockMapStore },
        { provide: PostalCodeService, useValue: mockPostalCodeService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LocationMapPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default state', () => {
      expect(component.tableExpanded()).toBe(true); // Has postal codes and not manually collapsed
    });

    it('should have mapStore injected', () => {
      expect(component.mapStore).toBeDefined();
    });
  });

  describe('Computed Properties', () => {
    it('should generate country options correctly', () => {
      const options = component.countryOptions();
      expect(options).toEqual([
        {
          value: 'US',
          label: 'United States (1,000 codes)',
        },
      ]);
    });

    it('should generate city options correctly', () => {
      const options = component.cityOptions();
      expect(options).toEqual([
        {
          value: 'New York',
          label: 'New York (50 codes)',
        },
      ]);
    });

    it('should return empty arrays when no data available', () => {
      mockMapStore.countries.set([]);
      mockMapStore.cities.set([]);
      fixture.detectChanges();

      expect(component.countryOptions()).toEqual([]);
      expect(component.cityOptions()).toEqual([]);
    });
  });

  describe('Table Expansion Logic', () => {
    it('should expand table when has postal codes and not manually collapsed', () => {
      mockMapStore.postalCodes.set([mockPostalCode]);
      fixture.detectChanges();

      expect(component.tableExpanded()).toBe(true);
    });

    it('should collapse table when manually collapsed', () => {
      mockMapStore.postalCodes.set([mockPostalCode]);
      component.onTableToggle(false); // Manually collapse
      fixture.detectChanges();

      expect(component.tableExpanded()).toBe(false);
    });

    it('should not expand table when no postal codes', () => {
      mockMapStore.postalCodes.set([]);
      fixture.detectChanges();

      expect(component.tableExpanded()).toBe(false);
    });
  });

  describe('User Interaction Handlers', () => {
    beforeEach(() => {
      // Setup a mock mapCanvas
      const mockMapCanvas = new MockMapCanvasComponent();
      component.mapCanvas = mockMapCanvas as any;
    });

    it('should handle back button click', () => {
      component.onBackClick();

      expect(mockMapStore.clearSelection).toHaveBeenCalled();
      expect(component.mapCanvas?.resetToInitialState).toHaveBeenCalled();
    });

    it('should handle marker click', () => {
      component.onMarkerClick(mockPostalCode);

      expect(mockMapStore.setActiveMarker).toHaveBeenCalledWith(mockPostalCode);
    });

    it('should handle table row click', () => {
      component.onTableRowClick(mockPostalCode);

      expect(mockMapStore.setActiveMarker).toHaveBeenCalledWith(mockPostalCode);
      expect(component.mapCanvas?.highlightMarker).toHaveBeenCalledWith(
        mockPostalCode
      );
    });

    it('should handle table toggle', () => {
      component.onTableToggle(false);
      expect(component.tableExpanded()).toBe(false);

      component.onTableToggle(true);
      expect(component.tableExpanded()).toBe(true);
    });

    it('should handle country selection', () => {
      component.onNewCountrySelect('US');

      expect(mockMapStore.selectCountry).toHaveBeenCalledWith(mockCountry);
    });

    it('should handle city selection', () => {
      component.onNewCitySelect('New York');

      expect(mockMapStore.selectCity).toHaveBeenCalledWith(mockCity);
    });

    it('should handle invalid country selection gracefully', () => {
      spyOn(console, 'warn');
      component.onNewCountrySelect('INVALID');

      expect(mockMapStore.selectCountry).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('Country not found: INVALID');
    });

    it('should handle invalid city selection gracefully', () => {
      spyOn(console, 'warn');
      component.onNewCitySelect('INVALID');

      expect(mockMapStore.selectCity).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('City not found: INVALID');
    });
  });

  describe('Error Handling', () => {
    it('should handle back button errors gracefully', () => {
      spyOn(console, 'error');

      // Mock an error in mapCanvas
      const mockMapCanvas = {
        resetToInitialState: jasmine
          .createSpy('resetToInitialState')
          .and.throwError('Map error'),
      };
      component.mapCanvas = mockMapCanvas as any;

      // Should not throw
      expect(() => component.onBackClick()).not.toThrow();
      expect(mockMapStore.clearSelection).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Template Rendering', () => {
    it('should render map canvas component', () => {
      const mapCanvas = fixture.debugElement.query(By.css('app-map-canvas'));
      expect(mapCanvas).toBeTruthy();
    });

    it('should render search input component', () => {
      const searchInput = fixture.debugElement.query(
        By.css('app-search-input')
      );
      expect(searchInput).toBeTruthy();
    });

    it('should render collapsible results table', () => {
      const resultsTable = fixture.debugElement.query(
        By.css('app-collapsible-results-table')
      );
      expect(resultsTable).toBeTruthy();
    });

    it('should show back button when country is selected', () => {
      mockMapStore.selectedCountry.set(mockCountry);
      fixture.detectChanges();

      const backButton = fixture.debugElement.query(
        By.css('.back-button-neumorphism')
      );
      expect(backButton).toBeTruthy();
    });

    it('should show error overlay when error exists', () => {
      mockMapStore.error.set('Test error message');
      fixture.detectChanges();

      const errorOverlay = fixture.debugElement.query(By.css('[role="alert"]'));
      expect(errorOverlay).toBeTruthy();
      expect(errorOverlay.nativeElement.textContent).toContain(
        'Test error message'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const mapCanvas = fixture.debugElement.query(By.css('app-map-canvas'));
      expect(mapCanvas.nativeElement.getAttribute('aria-label')).toBe(
        'Interactive map showing postal code locations'
      );
    });

    it('should have skip link for keyboard navigation', () => {
      const skipLink = fixture.debugElement.query(
        By.css('a[href="#main-controls"]')
      );
      expect(skipLink).toBeTruthy();
      expect(skipLink.nativeElement.textContent.trim()).toBe(
        'Skip to main controls'
      );
    });

    it('should have proper heading structure', () => {
      const heading = fixture.debugElement.query(By.css('h1[role="heading"]'));
      expect(heading).toBeTruthy();
      expect(heading.nativeElement.getAttribute('aria-level')).toBe('1');
    });
  });
});
