import { CircleNotchIcon } from '@phosphor-icons/react/dist/csr/CircleNotch';
import { GpsFixIcon } from '@phosphor-icons/react/dist/csr/GpsFix';
import { GpsIcon } from '@phosphor-icons/react/dist/csr/Gps';
import { GpsSlashIcon } from '@phosphor-icons/react/dist/csr/GpsSlash';
import type { LocationStatus } from '../types';

interface Props {
  status: LocationStatus;
  size?: number;
  className?: string;
}

export default function GeolocationStatusIcon({ status, size = 14, className }: Props) {
  const iconProps = { size, weight: 'bold' as const, className, 'aria-hidden': true };

  switch (status) {
    case 'loading':
      return <CircleNotchIcon {...iconProps} />;
    case 'active':
      return <GpsFixIcon {...iconProps} />;
    case 'error':
      return <GpsSlashIcon {...iconProps} />;
    case 'idle':
    default:
      return <GpsIcon {...iconProps} />;
  }
}
