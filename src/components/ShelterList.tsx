import type { Shelter } from '../types';
import { useTranslation } from 'react-i18next';
import { shelterId } from '../utils/distance';
import { distanceKm, formatDistance, distanceColor, distanceFontWeight } from '../utils/distance';
import { FONT_WEIGHT_MAX } from '../constants';

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
  const { t } = useTranslation();
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
        const fontWeight = km !== null ? distanceFontWeight(km) : FONT_WEIGHT_MAX;

        const imageUrl = shelter.image_url?.trim();

        return (
          <li
            key={id}
            className={`shelter-list-item${activeShelterId === id ? ' active' : ''}${imageUrl ? ' has-image' : ''}`}
            style={
              imageUrl
                ? ({ '--item-image': `url("${imageUrl}")` } as React.CSSProperties)
                : undefined
            }
            onClick={() => onShelterClick(shelter)}
          >
            {km !== null && (
              <div className="distance" style={{ color: distanceColor(km) }}>
                {formatDistance(km)}
              </div>
            )}
            <div className="info">
              <div className="name" style={{ fontWeight }}>
                {shelter.name ?? t('shelterList.noName')}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
