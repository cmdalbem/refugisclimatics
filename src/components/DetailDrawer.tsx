import { useEffect } from 'react';
import { X } from 'lucide-react';
import type { Shelter } from '../types';
import { TYPOLOGY_ICONS, DEFAULT_ICON } from '../constants';
import { ICON_COMPONENTS } from '../utils/iconRegistry';
import { distanceKm, formatDistance, distanceColor } from '../utils/distance';
import { formatLocation } from '../utils/distance';

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && shelter) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shelter, onClose]);

  const km =
    shelter &&
    userLocation &&
    typeof shelter.lat === 'number' &&
    typeof shelter.lon === 'number'
      ? distanceKm(userLocation[1], userLocation[0], shelter.lat, shelter.lon)
      : null;

  const location = shelter ? formatLocation(shelter) : '';
  const iconName = shelter ? (TYPOLOGY_ICONS[shelter.typology ?? ''] ?? DEFAULT_ICON) : DEFAULT_ICON;
  const TypologyIcon = ICON_COMPONENTS[iconName] ?? ICON_COMPONENTS[DEFAULT_ICON];

  return (
    <aside
      id="detail-drawer"
      className={`detail-drawer${shelter ? ' open' : ''}`}
      aria-hidden={!shelter}
    >
      <div className="detail-drawer-panel">
        <button type="button" className="detail-close" onClick={onClose} aria-label="Tancar">
          <X size={16} />
        </button>

        <div className="detail-scroll">
          {shelter && (
            <div id="detail-content">
              {shelter.image_url && (
                <figure className="detail-image">
                  <img src={shelter.image_url} alt={shelter.name ?? ''} loading="lazy" />
                </figure>
              )}

              <div className={`detail-body${shelter.image_url ? '' : ' detail-body--no-image'}`}>
                <header className="detail-intro">
                  <div className="detail-meta">
                    <span className="detail-typology">
                      {TypologyIcon && <TypologyIcon size={13} strokeWidth={2.25} />}
                      {shelter.typology ?? 'Refugi climàtic'}
                    </span>
                    {km !== null && (
                      <span className="detail-distance" style={{ color: distanceColor(km) }}>
                        {formatDistance(km)}
                      </span>
                    )}
                  </div>

                  <h2 className="detail-name">{shelter.name ?? 'Sense nom'}</h2>

                  {location && <p className="detail-location">{location}</p>}
                </header>

                {shelter.notice && (
                  <section className="detail-block">
                    <div className="detail-notice">
                      <p>{shelter.notice}</p>
                    </div>
                  </section>
                )}

                {shelter.characteristics?.length ? (
                  <section className="detail-block">
                    <h3 className="detail-section-title">Característiques</h3>
                    <ul className="detail-chars">
                      {shelter.characteristics.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {shelter.opening_hours_raw?.length ? (
                  <OpeningHours rows={shelter.opening_hours_raw} />
                ) : null}

                <Contact shelter={shelter} />

                {shelter.match_status === 'cms_only' && (
                  <p className="detail-data-note">
                    Dades limitades: aquest refugi no consta a l&apos;open data de Barcelona.
                    Contacte i horaris poden estar incomplets.
                  </p>
                )}

                {shelter.detail_url && (
                  <footer className="detail-block detail-footer">
                    <a
                      className="detail-link"
                      href={shelter.detail_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Més informació a barcelona.cat →
                    </a>
                  </footer>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
