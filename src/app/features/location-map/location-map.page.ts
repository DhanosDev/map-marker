import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-location-map-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-900 text-white">
      <!-- Header -->
      <header class="p-4 border-b border-gray-700">
        <div class="container mx-auto flex items-center justify-between">
          <h1 class="text-xl font-bold">Postal Code Map</h1>
          <button
            class="text-gray-300 hover:text-white transition-colors"
            (click)="goBack()"
          >
            ← Back
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="container mx-auto p-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Map Section -->
          <div class="bg-gray-800 rounded-lg p-4 min-h-[400px]">
            <h2 class="text-lg font-semibold mb-4">Map View</h2>
            <div
              class="bg-gray-700 rounded h-80 flex items-center justify-center"
            >
              <span class="text-gray-400">Map will render here</span>
            </div>
          </div>

          <!-- Controls Section -->
          <div class="bg-gray-800 rounded-lg p-4">
            <h2 class="text-lg font-semibold mb-4">Search & Results</h2>
            <div class="space-y-4">
              <div class="bg-gray-700 rounded p-3">
                <span class="text-gray-400">Country selector will be here</span>
              </div>
              <div class="bg-gray-700 rounded p-3 min-h-[200px]">
                <span class="text-gray-400">Results table will be here</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class LocationMapPageComponent {
  isLoading = signal(false);
  selectedCountry = signal('');

  hasSelectedCountry = computed(() => this.selectedCountry().length > 0);

  goBack(): void {
    window.history.back();
  }
}
