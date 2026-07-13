import { Link } from 'react-router-dom';
import type { Shelter } from '../types';
import { useTranslation } from 'react-i18next';
import { shelterId } from '../utils/distance';
import { distanceKm, formatDistance, distanceColor, distanceFontWeight } from '../utils/distance';
import { shelterPath } from '../utils/slug';
import { FONT_WEIGHT_MAX, priorityAmenityIcons } from '../constants';
import CharacteristicIcon from './CharacteristicIcon';

interface Props {
  shelters: Shelter[];
  loading?: boolean;
  activeTypology: string;
  activeShelterId: string | null;
  userLocation: [number, number] | null;
}

export default function ShelterList({
  shelters,
  loading = false,
  activeTypology,
  activeShelterId,
  userLocation,
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
    <ul id="shelter-list" aria-busy={loading}>
      {loading ? (
        <li className="shelter-list-loading" aria-live="polite">
          {t('shelterList.loading')}
        </li>
      ) : (
        sorted.map(shelter => {
        const id = shelterId(shelter);
        const km = userLocation
          ? distanceKm(userLocation[1], userLocation[0], shelter.lat!, shelter.lon!)
          : null;
        const fontWeight = km !== null ? distanceFontWeight(km) : FONT_WEIGHT_MAX;

        const imageUrl = shelter.image_url?.trim();
        const amenities = priorityAmenityIcons(shelter.characteristics);

        return (
          <li key={id}>
            <Link
              to={shelterPath(shelter)}
              className={`shelter-list-item${activeShelterId === id ? ' active' : ''}${imageUrl ? ' has-image' : ''}`}
              style={
                imageUrl
                  ? ({ '--item-image': `url("${imageUrl}")` } as React.CSSProperties)
                  : undefined
              }
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
                {amenities.length > 0 && (
                  <div className="shelter-list-amenities">
                    {amenities.map((key) => (
                      <span
                        key={key}
                        className="shelter-list-amenity"
                        aria-label={t(`characteristics.${key}`, { defaultValue: key })}
                      >
                        <CharacteristicIcon name={key} size={16} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </li>
        );
      })
      )}
    </ul>
  );
}
