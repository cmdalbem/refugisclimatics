import { useEffect, useState } from 'react';
import { Drawer } from 'vaul';
import type { Shelter } from '../types';
import { TYPOLOGY_ICONS, TYPOLOGY_LABELS, DEFAULT_ICON, FONT_WEIGHT_MAX } from '../constants';
import PinIcon from './PinIcon';
import { distanceKm, formatDistance, distanceColor, distanceFontWeight } from '../utils/distance';
import { formatLocation } from '../utils/distance';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  shelter: Shelter | null;
  userLocation: [number, number] | null;
  onClose: () => void;
}

function OpeningHours({ rows }: { rows: [string?, string?, string?][] }) {
  const valid = rows.filter(
    ([p, d, h]) => (p ?? '').trim() || (d ?? '').trim() || (h ?? '').trim(),
  );
  if (!valid.length) return null;

  const hasPeriods = valid.some(([p]) => (p ?? '').trim());

  return (
    <section className="detail-block">
      <h3 className="detail-section-title">Horari</h3>
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

function Contact({ shelter }: { shelter: Shelter }) {
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
      <h3 className="detail-section-title">Contacte</h3>
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
  const isMobile = useIsMobile();

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

      <div className={`detail-body${displayShelter.image_url ? '' : ' detail-body--no-image'}`}>
        <header className="detail-intro">
          <div className="detail-meta">
            <span className="detail-typology">
              <PinIcon name={iconName} size={13} />
              {displayShelter.typology
                ? (TYPOLOGY_LABELS[displayShelter.typology] ?? displayShelter.typology)
                : 'Refugi climàtic'}
            </span>
            {km !== null && (
              <span className="detail-distance" style={{ color: distanceColor(km) }}>
                {formatDistance(km)}
              </span>
            )}
          </div>

          <h2 className="detail-name" style={{ fontWeight }}>
            {displayShelter.name ?? 'Sense nom'}
          </h2>

          {location && <p className="detail-location">{location}</p>}
        </header>

        {displayShelter.notice && (
          <section className="detail-block">
            <div className="detail-notice">
              <p>{displayShelter.notice}</p>
            </div>
          </section>
        )}

        {displayShelter.characteristics?.length ? (
          <section className="detail-block">
            <h3 className="detail-section-title">Característiques</h3>
            <ul className="detail-chars">
              {displayShelter.characteristics.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {displayShelter.opening_hours_raw?.length ? (
          <OpeningHours rows={displayShelter.opening_hours_raw} />
        ) : null}

        <Contact shelter={displayShelter} />

        {displayShelter.match_status === 'cms_only' && (
          <p className="detail-data-note">
            Dades limitades: aquest refugi no consta a l&apos;open data de Barcelona.
            Contacte i horaris poden estar incomplets.
          </p>
        )}

        {displayShelter.detail_url && (
          <footer className="detail-block detail-footer">
            <a
              className="detail-link"
              href={displayShelter.detail_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Més informació a barcelona.cat →
            </a>
          </footer>
        )}
      </div>
    </div>
  );

  const closeButton = (
    <button type="button" className="detail-close" onClick={onClose} aria-label="Tancar">
      <PinIcon name="x" size={16} />
    </button>
  );

  if (isMobile) {
    return (
      <Drawer.Root
        open={!!shelter}
        onOpenChange={open => {
          if (!open) onClose();
        }}
        modal={false}
        dismissible
        autoFocus={false}
      >
        <Drawer.Content id="detail-drawer" aria-describedby={undefined}>
          <Drawer.Title className="sr-only">{displayShelter?.name ?? 'Detall del refugi'}</Drawer.Title>
          <div className="detail-drawer-panel">
            <Drawer.Handle className="sheet-handle" />
            {closeButton}
            <div className="detail-scroll">{content}</div>
          </div>
        </Drawer.Content>
      </Drawer.Root>
    );
  }

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
