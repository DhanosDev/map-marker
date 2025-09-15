import * as L from 'leaflet';
import { PostalCode } from '../models/business.interfaces';

const defaultIcon = L.icon({
  iconUrl:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDlDNSAxNC4yNSAxMiAyMiAxMiAyMkMxMiAyMiAxOSAxNC4yNSAxOSA5QzE5IDUuMTMgMTUuODcgMiAxMiAyWk0xMiAxMS41QzEwLjYyIDExLjUgOS41IDEwLjM4IDkuNSA5UzkuNSA2LjUgMTIgNi41UzE0LjUgNy42MiAxNC41IDlTMTMuMzggMTEuNSAxMiAxMS41WiIgZmlsbD0iIzNiODJmNiIvPgo8L3N2Zz4K',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

export interface MapMarker {
  id: string;
  postalCode: PostalCode;
  marker: L.Marker;
}

export const createMarkerFromPostalCode = (
  postalCode: PostalCode
): L.Marker => {
  const marker = L.marker([postalCode.latitude, postalCode.longitude], {
    icon: defaultIcon,
    title: `${postalCode.postalCode} - ${postalCode.placeName}`,
  });

  const popupContent = `
    <div class="p-2">
      <h3 class="font-bold text-sm">${postalCode.postalCode}</h3>
      <p class="text-xs">${postalCode.placeName}</p>
      <p class="text-xs text-gray-600">${postalCode.region}</p>
    </div>
  `;

  marker.bindPopup(popupContent);

  return marker;
};

export const createMarkersGroup = (postalCodes: PostalCode[]): MapMarker[] => {
  return postalCodes.map((postalCode) => ({
    id: `${postalCode.postalCode}-${postalCode.latitude}-${postalCode.longitude}`,
    postalCode,
    marker: createMarkerFromPostalCode(postalCode),
  }));
};
