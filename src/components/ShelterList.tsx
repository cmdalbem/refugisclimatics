import type { Shelter } from '../types';
import { shelterId } from '../utils/distance';
import { distanceKm, formatDistance, distanceColor, distanceFontYear } from '../utils/distance';
import { CLIMATE_FONT_YEAR_MIN } from '../constants';

interface Props {
  shelters: Shelter[];
  activeTypology: string;
  activeShelterId: string | null;
  userLocation: [number, number] | null;
  onShelterClick: (shelter: Shelter) => void;
}

export default function ShelterList({
  shelters,
  activeTypology,
  activeShelterId,
  userLocation,
  onShelterClick,
}: Props) {
  const filtered = shelters
    .filter(s => typeof s.lat === 'number' && typeof s.lon === 'number')
    .filter(s => !activeTypology || s.typology === activeTypology);

  const sorted = userLocation
    ? [...filtered].sort(
        (a, b) =>
          distanceKm(userLocation[1], userLocation[0], a.lat!, a.lon!) -
          distanceKm(userLocation[1], userLocation[0], b.lat!, b.lon!),
      )
    : [...filtered].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));

  return (
    <ul id="shelter-list">
      {sorted.map(shelter => {
        const id = shelterId(shelter);
        const km = userLocation
          ? distanceKm(userLocation[1], userLocation[0], shelter.lat!, shelter.lon!)
          : null;
        const fontYear = km !== null ? distanceFontYear(km) : CLIMATE_FONT_YEAR_MIN;

        return (
          <li
            key={id}
            className={`shelter-list-item${activeShelterId === id ? ' active' : ''}`}
            onClick={() => onShelterClick(shelter)}
          >
            {km !== null && (
              <div className="distance" style={{ color: distanceColor(km) }}>
                {formatDistance(km)}
              </div>
            )}
            <div className="info">
              <div
                className="name"
                style={{ fontVariationSettings: `'YEAR' ${fontYear}` }}
              >
                {shelter.name ?? 'Sense nom'}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
