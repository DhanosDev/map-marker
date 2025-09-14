// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/location-map',
    pathMatch: 'full',
  },
  {
    path: 'location-map',
    loadComponent: () =>
      import('./features/location-map/location-map.page').then(
        (c) => c.LocationMapPageComponent
      ),
  },
  {
    path: '**',
    redirectTo: '/location-map',
  },
];
