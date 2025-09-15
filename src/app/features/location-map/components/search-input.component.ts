import {
  Component,
  Output,
  EventEmitter,
  signal,
  computed,
  HostListener,
  input,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  value: string;
  label: string;
}

export type SearchInputType = 'country' | 'city';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative w-full">
      <!-- Custom Dropdown Input -->
      <div class="relative w-full">
        <!-- Display Input -->
        <button
          type="button"
          class="w-full px-7 py-3.5 pr-16 bg-search-input text-white font-roboto cursor-pointer tracking-search text-[17px] leading-[22px] rounded-full border-0 outline-none appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:shadow-search-focus transition-shadow duration-200 text-left"
          [class.opacity-50]="isLoading()"
          [disabled]="isLoading()"
          [attr.aria-expanded]="isOpen()"
          [attr.aria-haspopup]="'listbox'"
          [attr.aria-label]="
            type() === 'country' ? 'Select country' : 'Select city'
          "
          role="combobox"
          (click)="toggleDropdown()"
          (keydown.enter)="toggleDropdown()"
          (keydown.space)="$event.preventDefault(); toggleDropdown()"
          (keydown.arrowdown)="$event.preventDefault(); openDropdown()"
          (focus)="onFocus()"
          (blur)="onBlur()"
        >
          <span [class.text-gray-400]="!selectedValue()">
            {{ displayText() }}
          </span>
        </button>

        <!-- Dropdown Arrow Icon -->
        <div
          class="absolute right-[19px] top-1/2 -translate-y-1/2 pointer-events-none"
        >
          @if (isLoading()) {
            <!-- Loading spinner -->
            <div
              class="animate-spin w-3 h-3 border border-white border-t-transparent rounded-full"
              aria-label="Loading options"
            ></div>
          } @else {
            <!-- SVG Triangle Icon -->
            <svg
              width="12"
              height="5"
              viewBox="0 0 12 5"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              class="transition-transform duration-200 ease-in-out"
              [class.rotate-180]="isOpen()"
              aria-hidden="true"
            >
              <path
                d="M8.51367 1.5H3.48633L6 3.67773L8.51367 1.5Z"
                fill="#242C3B"
                stroke="white"
                stroke-width="2"
              />
            </svg>
          }
        </div>

        <!-- Dropdown Options -->
        @if (isOpen() && !isLoading()) {
          <div
            class="absolute top-full left-0 right-0 mt-1 bg-search-input border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
            role="listbox"
            [attr.aria-label]="
              type() === 'country' ? 'Country options' : 'City options'
            "
          >
            @if (options().length === 0) {
              <!-- Empty State -->
              <div
                class="px-4 py-3 text-gray-400 text-sm text-center"
                role="status"
              >
                @if (type() === 'city') {
                  <span>No hay ciudades disponibles</span>
                } @else {
                  <span>No hay países disponibles</span>
                }
              </div>
            } @else {
              @for (option of options(); track option.value) {
                <button
                  type="button"
                  class="w-full px-4 py-3 text-left text-white font-roboto tracking-search text-[17px] leading-[22px] hover:bg-white/10 transition-colors duration-200 cursor-pointer border-0 bg-transparent focus:outline-none focus:bg-white/20"
                  [class.bg-blue-600]="option.value === selectedValue()"
                  role="option"
                  [attr.aria-selected]="option.value === selectedValue()"
                  (click)="selectOption(option.value)"
                  (keydown.enter)="selectOption(option.value)"
                  (keydown.space)="
                    $event.preventDefault(); selectOption(option.value)
                  "
                >
                  {{ option.label }}
                </button>
              }
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      /* Custom scrollbar para dropdown */
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
export class SearchInputComponent {
  type = input<SearchInputType>('country');
  options = input<SelectOption[]>([]);
  placeholder = input<string>('Seleccionar...');
  isLoading = input<boolean>(false);
  selectedValue = input<string | undefined>(undefined);

  @Output() valueSelected = new EventEmitter<string>();

  isFocused = signal(false);
  isOpen = signal(false);

  readonly displayText = computed(() => {
    const selected = this.selectedValue();
    return selected || this.placeholder();
  });

  private readonly host = inject(ElementRef<HTMLElement>);

  /**
   * Toggle dropdown open/close
   */
  toggleDropdown(): void {
    if (this.isLoading()) return;
    this.isOpen.update((open) => !open);
  }

  /**
   * Open dropdown
   */
  openDropdown(): void {
    if (this.isLoading()) return;
    this.isOpen.set(true);
  }

  /**
   * Close dropdown
   */
  closeDropdown(): void {
    this.isOpen.set(false);
  }

  /**
   * Select an option
   */
  selectOption(value: string): void {
    this.closeDropdown();
    this.valueSelected.emit(value);
  }

  /**
   * Handle focus state
   */
  onFocus(): void {
    this.isFocused.set(true);
  }

  /**
   * Handle blur state
   */
  onBlur(): void {
    this.isFocused.set(false);
    setTimeout(() => this.closeDropdown(), 150);
  }

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Node | null;
    if (target && !this.host.nativeElement.contains(target)) {
      this.closeDropdown();
    }
  }

  /**
   * Handle keyboard navigation
   */
  @HostListener('keydown.escape')
  onEscape(): void {
    this.closeDropdown();
  }
}
