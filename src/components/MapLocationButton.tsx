import type { LocationStatus } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  status: LocationStatus;
  statusText: string;
  onClick: () => void;
}

function LocateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function MapLocationButton({ status, statusText, onClick }: Props) {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  return (
    <button
      type="button"
      id="map-location-btn"
      className={`map-location-btn status-${status}`}
      onClick={onClick}
      aria-label={statusText}
      aria-busy={status === 'loading'}
    >
      <LocateIcon />
    </button>
  );
}
