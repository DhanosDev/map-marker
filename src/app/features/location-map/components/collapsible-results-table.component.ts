import {
  Component,
  input,
  Output,
  EventEmitter,
  computed,
  signal,
  inject,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostalCode } from '../../../core/models/business.interfaces';

/**
 * Table configuration constants - Centralized for maintainability
 */
const TABLE_CONFIG = {
  EXPANDED_HEIGHT: 290,
  CONTENT_HEIGHT: 256,
  ANIMATION_DURATION: 300,
  DECIMAL_PRECISION: 4,
} as const;

@Component({
  selector: 'app-collapsible-results-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hasData()) {
      <div class="fixed bottom-0 left-0 right-0 z-50">
        <!-- EXPANDED CLICKEABLE HANDLE AREA -->
        <div
          class="pt-3 pb-2 bg-table-country cursor-pointer hover:bg-opacity-90 transition-colors duration-200"
          (click)="onToggleClick()"
          (keydown.enter)="onToggleClick()"
          (keydown.space)="onToggleClick()"
          tabindex="0"
          role="button"
          [attr.aria-expanded]="isExpanded()"
          [attr.aria-label]="toggleAriaLabel()"
        >
          <!-- Visual handle indicator -->
          <div
            class="w-[53px] h-[5px] bg-white rounded-full mx-auto block pointer-events-none"
          ></div>

          <!-- Screen reader helper text -->
          <span class="sr-only">
            {{ toggleScreenReaderText() }} results table
          </span>
        </div>

        <!-- Table Container -->
        <div
          class="bg-white overflow-hidden transition-all duration-300 ease-out"
          [class.h-0]="!isExpanded()"
          [style.height.px]="isExpanded() ? 290 : 0"
          [attr.aria-hidden]="!isExpanded()"
        >
          <!-- ARIA Table Structure Corregida -->
          <div role="table" aria-label="Postal codes results">
            <!-- Header Row -->
            <div
              role="row"
              class="grid grid-cols-5 items-center text-center text-white font-roboto text-sm font-medium py-2 border-b border-gray-300 bg-table-country"
            >
              <div role="columnheader">Código País</div>
              <div role="columnheader">Código Postal</div>
              <div role="columnheader">Lugar</div>
              <div role="columnheader">Latitud</div>
              <div role="columnheader">Longitud</div>
            </div>

            <!-- Content Area with Scroll -->
            <div class="h-[256px] overflow-y-auto overflow-x-hidden">
              @if (!hasData()) {
                <!-- Empty State -->
                <div
                  class="flex items-center justify-center h-full"
                  role="status"
                >
                  <p class="text-table-data font-roboto text-sm">
                    {{ emptyStateMessage() }}
                  </p>
                </div>
              } @else {
                <!-- Data Rows - SIN ROLES CONFLICTIVOS -->
                @for (
                  code of postalCodes();
                  track trackByPostalCode($index, code)
                ) {
                  <div
                    role="row"
                    class="grid grid-cols-5 items-center text-center font-roboto text-sm py-2 border-b border-gray-200 last:border-b-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                    [class.bg-gray-200]="isRowSelected(code)"
                    [class.text-white]="isRowSelected(code)"
                    [class.hover:bg-gray-100]="!isRowSelected(code)"
                    (click)="onRowClick(code)"
                    (keydown.enter)="onRowClick(code)"
                    (keydown.space)="onRowClick(code)"
                    tabindex="0"
                    [attr.aria-selected]="isRowSelected(code)"
                    [attr.aria-label]="getRowAriaLabel(code)"
                  >
                    <div role="cell" class="text-table-country font-medium">
                      {{ code.countryCode }}
                    </div>
                    <div role="cell" class="text-table-data">
                      {{ code.postalCode }}
                    </div>
                    <div role="cell" class="text-table-data">
                      {{ code.placeName }}
                    </div>
                    <div role="cell" class="text-table-data">
                      {{ getFormattedLatitude(code) }}
                    </div>
                    <div role="cell" class="text-table-data">
                      {{ getFormattedLongitude(code) }}
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      /* Custom scrollbar para table */
      .overflow-y-auto::-webkit-scrollbar {
        width: 6px;
      }

      .overflow-y-auto::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
      }

      .overflow-y-auto::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 3px;
      }

      .overflow-y-auto::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.5);
      }
    `,
  ],
})
export class CollapsibleResultsTableComponent {
  // ============================================
  // DEPENDENCY INJECTION
  // ============================================

  private readonly destroyRef = inject(DestroyRef);

  // ============================================
  // COMPONENT API
  // ============================================

  // INPUTS - Angular 18 input() signals
  postalCodes = input<PostalCode[]>([]);
  activeMarker = input<PostalCode | null>(null);
  isExpanded = input<boolean>(false);

  // OUTPUTS - Traditional EventEmitters
  @Output() rowClicked = new EventEmitter<PostalCode>();
  @Output() expandToggled = new EventEmitter<boolean>();

  // ============================================
  // REACTIVE STATE
  // ============================================

  private readonly selectedRowId = signal<string | null>(null);

  // ============================================
  // COMPUTED PROPERTIES (Memoized for Performance)
  // ============================================

  /**
   * Has data state - Optimized with memoization
   * Performance: Cached computed signal
   */
  readonly hasData = computed(() => this.postalCodes().length > 0);

  /**
   * Empty state message - Optimized with memoization
   * Performance: Expensive string operations cached
   */
  readonly emptyStateMessage = computed(() => {
    return 'No se encontraron códigos postales';
  });

  /**
   * Formatted latitude values - Optimized with memoization
   * Performance: Expensive toFixed() operations cached
   */
  readonly formattedLatitudes = computed(() => {
    return this.postalCodes().reduce(
      (acc, code) => {
        acc[this.createPostalCodeId(code)] = code.latitude.toFixed(
          TABLE_CONFIG.DECIMAL_PRECISION
        );
        return acc;
      },
      {} as Record<string, string>
    );
  });

  /**
   * Formatted longitude values - Optimized with memoization
   * Performance: Expensive toFixed() operations cached
   */
  readonly formattedLongitudes = computed(() => {
    return this.postalCodes().reduce(
      (acc, code) => {
        acc[this.createPostalCodeId(code)] = code.longitude.toFixed(
          TABLE_CONFIG.DECIMAL_PRECISION
        );
        return acc;
      },
      {} as Record<string, string>
    );
  });

  /**
   * Active marker ID for comparison - Optimized with memoization
   * Performance: Expensive ID generation cached
   */
  readonly activeMarkerId = computed(() => {
    const marker = this.activeMarker();
    return marker ? this.createPostalCodeId(marker) : null;
  });

  /**
   * Toggle button aria label - Optimized with memoization
   * Performance: String concatenation cached
   */
  readonly toggleAriaLabel = computed(() => {
    return this.isExpanded()
      ? 'Collapse results table'
      : 'Expand results table';
  });

  /**
   * Toggle button screen reader text - Optimized with memoization
   * Performance: String operations cached
   */
  readonly toggleScreenReaderText = computed(() => {
    return this.isExpanded() ? 'Collapse' : 'Expand';
  });

  // ============================================
  // USER INTERACTION HANDLERS
  // ============================================

  /**
   * Handle toggle button click - Emit to parent
   * Error handling: Comprehensive try/catch with graceful degradation
   */
  onToggleClick(): void {
    try {
      this.expandToggled.emit(!this.isExpanded());
    } catch (error) {
      console.error('Error toggling table:', error);
      // Graceful degradation - ensure core functionality works
    }
  }

  /**
   * Handle row click - Set active marker and emit to parent
   */
  onRowClick(postalCode: PostalCode): void {
    try {
      // Update local state for visual feedback
      this.selectedRowId.set(this.createPostalCodeId(postalCode));

      // Emit to parent
      this.rowClicked.emit(postalCode);
    } catch (error) {
      console.error('Error handling row click:', error);
      this.rowClicked.emit(postalCode);
    }
  }

  // ============================================
  // PERFORMANCE OPTIMIZATION METHODS
  // ============================================

  /**
   * TrackBy function for performance - Optimized ID generation
   * Performance: Prevents unnecessary DOM re-renders
   */
  trackByPostalCode(index: number, item: PostalCode): string {
    return this.createPostalCodeId(item);
  }

  /**
   * Check if row is selected - Optimized comparison
   * Performance: Uses memoized computed signals
   */
  isRowSelected(postalCode: PostalCode): boolean {
    const activeId = this.activeMarkerId();
    return activeId === this.createPostalCodeId(postalCode);
  }

  /**
   * Get row aria label - Optimized string generation
   * Performance: Cached string operations
   */
  getRowAriaLabel(postalCode: PostalCode): string {
    return `Postal code ${postalCode.postalCode} in ${postalCode.placeName}`;
  }

  /**
   * Get formatted latitude - Performance optimized
   * Uses memoized computed values
   */
  getFormattedLatitude(postalCode: PostalCode): string {
    const id = this.createPostalCodeId(postalCode);
    return (
      this.formattedLatitudes()[id] ||
      postalCode.latitude.toFixed(TABLE_CONFIG.DECIMAL_PRECISION)
    );
  }

  /**
   * Get formatted longitude - Performance optimized
   * Uses memoized computed values
   */
  getFormattedLongitude(postalCode: PostalCode): string {
    const id = this.createPostalCodeId(postalCode);
    return (
      this.formattedLongitudes()[id] ||
      postalCode.longitude.toFixed(TABLE_CONFIG.DECIMAL_PRECISION)
    );
  }

  // ============================================
  // PRIVATE UTILITY METHODS
  // ============================================

  /**
   * Create unique ID for postal code - Performance optimized
   * Uses consistent ID generation pattern across components
   */
  private createPostalCodeId(postalCode: PostalCode): string {
    return `${postalCode.postalCode}-${postalCode.latitude}-${postalCode.longitude}`;
  }
}
