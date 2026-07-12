import { getColoredSvg } from '../utils/iconRegistry';

interface Props {
  name: string;
  size?: number;
  className?: string;
  color?: string;
}

export default function PinIcon({ name, size = 16, className, color }: Props) {
  const svg = getColoredSvg(name, color ?? 'currentColor');
  if (!svg) return null;

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', width: size, height: size, lineHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: svg }}
      aria-hidden
    />
  );
}
