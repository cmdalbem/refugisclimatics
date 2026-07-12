import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Shelter } from '../types';
import { TYPOLOGY_ICONS, DEFAULT_ICON, FONT_WEIGHT_MAX } from '../constants';
import PinIcon from './PinIcon';
import { distanceKm, distanceFontWeight } from '../utils/distance';
import { formatLocation, mapsUrlForShelter } from '../utils/distance';

interface Props {
  shelter: Shelter | null;
  userLocation: [number, number] | null;
  onClose: () => void;
}

function OpeningHours({ rows }: { rows: [string?, string?, string?][] }) {
  const { t } = useTranslation();
  const valid = rows.filter(
    ([p, d, h]) => (p ?? '').trim() || (d ?? '').trim() || (h ?? '').trim(),
  );
  if (!valid.length) return null;

  const hasPeriods = valid.some(([p]) => (p ?? '').trim());

  return (
    <section className="detail-block">
      <h3 className="detail-section-title">{t('detailDrawer.hours')}</h3>
      <table className={`detail-hours${hasPeriods ? ' has-periods' : ''}`}>
        <tbody>
          {valid.map(([period, days, hours], i) => (
            <tr key={i}>
              {hasPeriods && <td className="hours-period">{period}</td>}
              <td>{days}</td>
              <td>{hours}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Location({ location, mapsUrl }: { location: string; mapsUrl: string | null }) {
  const { t } = useTranslation();
  if (!location) return null;

  return (
    <section className="detail-block">
      <h3 className="detail-section-title">{t('detailDrawer.directions')}</h3>
      {mapsUrl ? (
        <a
          className="detail-directions"
          href={mapsUrl}
          aria-label={t('detailDrawer.openDirections', { address: location })}
        >
          <span className="detail-directions-address">{location}</span>
          <PinIcon name="navigation_arrow_top_right" size={18} className="detail-directions-icon" />
        </a>
      ) : (
        <p className="detail-location">{location}</p>
      )}
    </section>
  );
}

function Contact({ shelter }: { shelter: Shelter }) {
  const { t } = useTranslation();
  const { contact_type: type, contact_value: value } = shelter;
  if (!value) return null;

  const isEmail = value.includes('@');
  const isPhone = /^\+?[\d\s\-()/]{6,}$/.test(value);
  const isUrl = /^https?:\/\/|^www\./i.test(value);
  const href = isEmail
    ? `mailto:${value}`
    : isPhone
      ? `tel:${value.replace(/\s/g, '')}`
      : isUrl
        ? value.startsWith('http')
          ? value
          : `https://${value}`
        : null;

  const label = type && !isEmail && !isPhone && !isUrl ? `${type}: ` : '';

  return (
    <section className="detail-block">
      <h3 className="detail-section-title">{t('detailDrawer.contact')}</h3>
      <p className="detail-contact-value">
        {label}
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {value}
          </a>
        ) : (
          value
        )}
      </p>
    </section>
  );
}

export default function DetailDrawer({ shelter, userLocation, onClose }: Props) {
  const { t } = useTranslation();

  // Keep rendering the last shelter's content while the sheet animates closed,
  // so the swipe-to-dismiss transition doesn't show an empty box.
  const [displayShelter, setDisplayShelter] = useState(shelter);
  useEffect(() => {
    if (shelter) setDisplayShelter(shelter);
  }, [shelter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shelter) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shelter, onClose]);

  const km =
    displayShelter &&
    userLocation &&
    typeof displayShelter.lat === 'number' &&
    typeof displayShelter.lon === 'number'
      ? distanceKm(userLocation[1], userLocation[0], displayShelter.lat, displayShelter.lon)
      : null;

  const fontWeight = km !== null ? distanceFontWeight(km) : FONT_WEIGHT_MAX;
  const location = displayShelter ? formatLocation(displayShelter) : '';
  const mapsUrl = displayShelter ? mapsUrlForShelter(displayShelter) : null;
  const iconName = displayShelter
    ? (TYPOLOGY_ICONS[displayShelter.typology ?? ''] ?? DEFAULT_ICON)
    : DEFAULT_ICON;

  const content = displayShelter && (
    <div id="detail-content">
      {displayShelter.image_url && (
        <figure className="detail-image">
          <img src={displayShelter.image_url} alt={displayShelter.name ?? ''} loading="lazy" />
        </figure>
      )}

      <div className="detail-body">
        <header className="detail-intro">
          <div className="detail-typology-block">
            <span className="detail-typology">
              <PinIcon name={iconName} size={15} />
              {displayShelter.typology
                ? t(`typology.${displayShelter.typology}`, {
                    defaultValue: displayShelter.typology,
                  })
                : t('detailDrawer.fallbackTypology')}
            </span>
          </div>

          <h2 className="detail-name" style={{ fontWeight }}>
            {displayShelter.name ?? t('detailDrawer.noName')}
          </h2>
        </header>

        <Location location={location} mapsUrl={mapsUrl} />

        {displayShelter.notice && (
          <section className="detail-block">
            <div className="detail-notice">
              <PinIcon name="triangle_up_with_exclamation_point" size={20} className="detail-notice-icon" />
              <p>{displayShelter.notice}</p>
            </div>
          </section>
        )}

        {displayShelter.characteristics?.length ? (
          <section className="detail-block">
            <h3 className="detail-section-title">{t('detailDrawer.characteristics')}</h3>
            <ul className="detail-chars">
              {displayShelter.characteristics.map((c, i) => (
                <li key={i}>{t(`characteristics.${c}`, { defaultValue: c })}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {displayShelter.opening_hours_raw?.length ? (
          <OpeningHours rows={displayShelter.opening_hours_raw} />
        ) : null}

        <Contact shelter={displayShelter} />

        {displayShelter.match_status === 'cms_only' && (
          <p className="detail-data-note">{t('detailDrawer.limitedDataNotice')}</p>
        )}

        {displayShelter.detail_url && (
          <footer className="detail-block detail-footer">
            <a
              className="detail-link"
              href={displayShelter.detail_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('detailDrawer.moreInfo')}
            </a>
          </footer>
        )}
      </div>
    </div>
  );

  const closeButton = (
    <button type="button" className="detail-close" onClick={onClose} aria-label={t('detailDrawer.close')}>
      <PinIcon name="x" size={16} />
    </button>
  );

  return (
    <aside
      id="detail-drawer"
      className={`detail-drawer${shelter ? ' open' : ''}`}
      aria-hidden={!shelter}
    >
      <div className="detail-drawer-panel">
        {closeButton}
        <div className="detail-scroll">{content}</div>
      </div>
    </aside>
  );
}
