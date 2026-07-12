import type { Shelter } from '../types';
import {
  DISTANCE_GRADIENT_STOPS,
  COLOR_GRADIENT_MAX_KM,
  GRADIENT_LAT_MIN,
  GRADIENT_LAT_MAX,
  FONT_GRADIENT_MIN_KM,
  FONT_GRADIENT_MAX_KM,
  FONT_WEIGHT_MIN,
  FONT_WEIGHT_MAX,
} from '../constants';

export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export function latitudeGradientKm(lat: number): number {
  const span = GRADIENT_LAT_MAX - GRADIENT_LAT_MIN;
  const t = span <= 0 ? 0 : Math.min(Math.max((lat - GRADIENT_LAT_MIN) / span, 0), 1);
  return t * COLOR_GRADIENT_MAX_KM;
}

export function shelterGradientKm(
  shelter: Shelter,
  userLocation: [number, number] | null,
): number | null {
  if (typeof shelter.lat !== 'number' || typeof shelter.lon !== 'number') return null;
  if (userLocation) {
    return distanceKm(userLocation[1], userLocation[0], shelter.lat, shelter.lon);
  }
  return latitudeGradientKm(shelter.lat);
}

export function distanceColor(km: number): string {
  const stops = DISTANCE_GRADIENT_STOPS.map(hex => {
    const v = parseInt(hex.slice(1), 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255] as [number, number, number];
  });
  const t = Math.min(Math.max(km / COLOR_GRADIENT_MAX_KM, 0), 1) * (stops.length - 1);
  const i = Math.min(Math.floor(t), stops.length - 2);
  const localT = t - i;
  const [r1, g1, b1] = stops[i];
  const [r2, g2, b2] = stops[i + 1];
  return `rgb(${Math.round(r1 + (r2 - r1) * localT)}, ${Math.round(g1 + (g2 - g1) * localT)}, ${Math.round(b1 + (b2 - b1) * localT)})`;
}

export function distanceFontWeight(km: number): number {
  const span = FONT_GRADIENT_MAX_KM - FONT_GRADIENT_MIN_KM;
  const t = span <= 0 ? 0 : Math.min(Math.max((km - FONT_GRADIENT_MIN_KM) / span, 0), 1);
  return Math.round(FONT_WEIGHT_MAX - t * (FONT_WEIGHT_MAX - FONT_WEIGHT_MIN));
}

export function shelterId(shelter: Shelter): string {
  if (shelter.detail_url) return `url:${shelter.detail_url}`;
  if (shelter.register_id) return `id:${shelter.register_id}`;
  if (typeof shelter.lat === 'number' && typeof shelter.lon === 'number') {
    return `geo:${shelter.lat},${shelter.lon}`;
  }
  return `name:${shelter.name ?? ''}`;
}

export function formatLocation(shelter: Shelter): string {
  return [shelter.address, shelter.neighborhood, shelter.district].filter(Boolean).join(' · ');
}

export function mapsUrlForShelter(shelter: Shelter): string | null {
  const hasCoords = typeof shelter.lat === 'number' && typeof shelter.lon === 'number';
  const address = formatLocation(shelter);
  if (!hasCoords && !address && !shelter.comshiva_url) return null;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  if (/Android/i.test(ua)) {
    return hasCoords
      ? `geo:${shelter.lat},${shelter.lon}`
      : address
        ? `geo:0,0?q=${encodeURIComponent(address)}`
        : null;
  }

  return shelter.comshiva_url ?? null;
}
