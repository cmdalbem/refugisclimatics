import type { Shelter } from '../types';
import { shelterId } from './distance';

const COORD_PRECISION = 6;
/** Map-only spread so co-located markers stay clickable (~10 m). */
const SPREAD_RADIUS_M = 5;

function coordKey(lat: number, lon: number): string {
  return `${lat.toFixed(COORD_PRECISION)},${lon.toFixed(COORD_PRECISION)}`;
}

function offsetFromMeters(
  lat: number,
  lon: number,
  distanceM: number,
  angleRad: number,
): [number, number] {
  const dNorth = distanceM * Math.sin(angleRad);
  const dEast = distanceM * Math.cos(angleRad);
  const latRad = (lat * Math.PI) / 180;
  const displayLat = lat + dNorth / 111_320;
  const displayLon = lon + dEast / (111_320 * Math.cos(latRad));
  return [displayLon, displayLat];
}

/** Display [lon, lat] per shelter for map rendering; true coords unchanged elsewhere. */
export function buildDisplayCoordinateMap(shelters: Shelter[]): Map<string, [number, number]> {
  const result = new Map<string, [number, number]>();
  const groups = new Map<string, Shelter[]>();

  for (const shelter of shelters) {
    if (typeof shelter.lat !== 'number' || typeof shelter.lon !== 'number') continue;
    const key = coordKey(shelter.lat, shelter.lon);
    const group = groups.get(key) ?? [];
    group.push(shelter);
    groups.set(key, group);
  }

  for (const group of groups.values()) {
    if (group.length === 1) {
      const shelter = group[0];
      result.set(shelterId(shelter), [shelter.lon!, shelter.lat!]);
      continue;
    }

    const sorted = [...group].sort((a, b) => shelterId(a).localeCompare(shelterId(b)));
    const lat = sorted[0].lat!;
    const lon = sorted[0].lon!;

    sorted.forEach((shelter, index) => {
      const angle = Math.PI / 2 + (2 * Math.PI * index) / sorted.length;
      result.set(shelterId(shelter), offsetFromMeters(lat, lon, SPREAD_RADIUS_M, angle));
    });
  }

  return result;
}
