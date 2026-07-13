import type { LocationStatus } from '../types';
import { useIsMobile } from '../hooks/useIsMobile';
import GeolocationStatusIcon from './GeolocationStatusIcon';

interface Props {
  status: LocationStatus;
  statusText: string;
  onClick: () => void;
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
      <GeolocationStatusIcon status={status} size={22} className="list-status-icon" />
    </button>
  );
}
