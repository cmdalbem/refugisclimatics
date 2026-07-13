import type { Icon } from '@phosphor-icons/react';
import { PawPrintIcon } from '@phosphor-icons/react/dist/csr/PawPrint';
import { DropIcon } from '@phosphor-icons/react/dist/csr/Drop';
import { ToiletIcon } from '@phosphor-icons/react/dist/csr/Toilet';
import { WheelchairMotionIcon } from '@phosphor-icons/react/dist/csr/WheelchairMotion';
import { WifiHighIcon } from '@phosphor-icons/react/dist/csr/WifiHigh';

const CHARACTERISTIC_ICONS: Record<string, Icon> = {
  'Con lavabo': ToiletIcon,
  'Amb aigua per beure': DropIcon,
  'Con internet para uso público': WifiHighIcon,
  'Puntos de conexión Barcelona WiFi': WifiHighIcon,
  'Accesible para personas con discapacidad física': WheelchairMotionIcon,
  'Se admiten animales de compañía': PawPrintIcon,
};

interface Props {
  name: string;
  size?: number;
  className?: string;
}

export default function CharacteristicIcon({ name, size = 16, className }: Props) {
  const IconComponent = CHARACTERISTIC_ICONS[name];
  if (!IconComponent) return null;

  return <IconComponent size={size} weight="bold" className={className} aria-hidden />;
}
