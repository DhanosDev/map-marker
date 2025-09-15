import { Component, input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostalCode } from '../../../core/models/business.interfaces';

@Component({
  selector: 'app-collapsible-results-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (postalCodes().length > 0) {
      <div class="fixed bottom-0 left-0 right-0">
        <!-- Handle - SIEMPRE VISIBLE -->
        <div class="pt-3 pb-2 bg-table-country">
          <button
            class="w-[53px] h-[5px] bg-white rounded-full mx-auto block cursor-pointer"
            (click)="onToggleClick()"
            aria-label="Toggle table visibility"
          ></button>
        </div>

        <!-- Table Container - SOLO ESTA PARTE SE COLAPSA -->
        <div
          class="bg-white overflow-hidden transition-all duration-300 ease-out"
          [class.h-0]="!isExpanded()"
          [class.h-[290px]]="isExpanded()"
        >
          <!-- Header -->
          <div
            class="grid grid-cols-5 items-center text-center text-white font-roboto text-sm font-medium py-2 border-b border-gray-300 bg-table-country"
          >
            <div>Código País</div>
            <div>Código Postal</div>
            <div>Lugar</div>
            <div>Latitud</div>
            <div>Longitud</div>
          </div>

          <!-- Content Area with Scroll -->
          <div class="h-[256px] overflow-y-auto overflow-x-hidden">
            @if (postalCodes().length === 0) {
              <!-- Empty State -->
              <div class="flex items-center justify-center h-full">
                <p class="text-table-data font-roboto text-sm">
                  No se encontraron códigos postales
                </p>
              </div>
            } @else {
              <!-- Data Rows -->
              @for (
                code of postalCodes();
                track trackByPostalCode($index, code)
              ) {
                <div
                  class="grid grid-cols-5 items-center text-center font-roboto text-sm py-2 border-b border-gray-200 last:border-b-0 cursor-pointer"
                  [class.bg-blue-600]="code === activeMarker()"
                  [class.text-white]="code === activeMarker()"
                  [class.hover:bg-gray-100]="code !== activeMarker()"
                  (click)="onRowClick(code)"
                >
                  <div class="text-table-country font-medium">
                    {{ code.countryCode }}
                  </div>
                  <div class="text-table-data">{{ code.postalCode }}</div>
                  <div class="text-table-data">{{ code.placeName }}</div>
                  <div class="text-table-data">
                    {{ code.latitude.toFixed(4) }}
                  </div>
                  <div class="text-table-data">
                    {{ code.longitude.toFixed(4) }}
                  </div>
                </div>
              }
            }
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
  // INPUTS - Angular 18 input() signals
  postalCodes = input<PostalCode[]>([]);
  activeMarker = input<PostalCode | null>(null);
  isExpanded = input<boolean>(false);

  // OUTPUTS - Traditional EventEmitters
  @Output() rowClicked = new EventEmitter<PostalCode>();
  @Output() expandToggled = new EventEmitter<boolean>();

  /**
   * Handle toggle button click - Emit to parent
   */
  onToggleClick(): void {
    this.expandToggled.emit(!this.isExpanded());
  }

  /**
   * Handle row click - Emit to parent
   */
  onRowClick(postalCode: PostalCode): void {
    this.rowClicked.emit(postalCode);
  }

  /**
   * TrackBy function for performance
   */
  trackByPostalCode(index: number, item: PostalCode): string {
    return `${index}-${item.postalCode}-${item.latitude}-${item.longitude}`;
  }
}
