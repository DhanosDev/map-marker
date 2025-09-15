import * as L from 'leaflet';
import { PostalCode } from '../models/business.interfaces';

const normalIcon = L.icon({
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

const selectedIcon = L.divIcon({
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

export interface MapMarker {
  id: string;
  postalCode: PostalCode;
  marker: L.Marker;
}

export type MarkerSelectionCallback = (postalCode: PostalCode) => void;

export const createMarkerFromPostalCode = (
  postalCode: PostalCode,
  isSelected: boolean = false,
  onMarkerSelectionChange?: MarkerSelectionCallback
): L.Marker => {
  const icon = isSelected ? selectedIcon : normalIcon;

  const marker = L.marker([postalCode.latitude, postalCode.longitude], {
    icon: icon,
    title: `${postalCode.postalCode} - ${postalCode.placeName}`,
  });

  const popupContent = createPopupContent(postalCode);

  marker.bindPopup(popupContent, {
    closeButton: true,
    autoClose: true,
    className: 'custom-popup',
  });

  if (onMarkerSelectionChange) {
    marker.on('click', (e) => {
      e.originalEvent?.stopPropagation();

      onMarkerSelectionChange(postalCode);
    });
  }

  return marker;
};

const createPopupContent = (postalCode: PostalCode): string => {
  return `
    <div style="
      font-family: 'Roboto', sans-serif;
      padding: 0;
      margin: 0;
    ">
      <!-- Código Postal Header -->
      <div style="
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 8px;
        letter-spacing: -0.025em;
      ">
        ${postalCode.postalCode}
      </div>
      
      <!-- Lugar Principal -->
      <div style="
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 6px;
        line-height: 1.4;
      ">
        ${postalCode.placeName}
      </div>
      
      <!-- Región/Departamento -->
      <div style="
        font-size: 12px;
        font-weight: 400;
        color: #6b7280;
        margin-bottom: 12px;
        line-height: 1.3;
      ">
        ${postalCode.region}
        ${postalCode.department ? `, ${postalCode.department}` : ''}
      </div>
      
      <!-- Coordenadas -->
      <div style="
        border-top: 1px solid #e5e7eb;
        padding-top: 8px;
        font-size: 11px;
        color: #9ca3af;
        font-weight: 400;
        display: flex;
        justify-content: space-between;
      ">
        <span>Lat: ${postalCode.latitude.toFixed(4)}</span>
        <span>Lng: ${postalCode.longitude.toFixed(4)}</span>
      </div>
    </div>
  `;
};

export const createMarkersGroup = (
  postalCodes: PostalCode[],
  selectedPostalCode?: PostalCode | null,
  onMarkerSelectionChange?: MarkerSelectionCallback
): MapMarker[] => {
  return postalCodes.map((postalCode) => {
    const isSelected =
      selectedPostalCode?.postalCode === postalCode.postalCode &&
      selectedPostalCode?.latitude === postalCode.latitude &&
      selectedPostalCode?.longitude === postalCode.longitude;

    return {
      id: `${postalCode.postalCode}-${postalCode.latitude}-${postalCode.longitude}`,
      postalCode,
      marker: createMarkerFromPostalCode(
        postalCode,
        isSelected,
        onMarkerSelectionChange
      ),
    };
  });
};
