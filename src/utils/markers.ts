import type { Map as MapboxMap } from 'mapbox-gl';
import { getColoredSvg } from './iconRegistry';
import { DEFAULT_MARKER_COLOR } from '../constants';
import { getCurrentTheme } from '../hooks/useTheme';

export function getMapThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  const markerStroke = styles.getPropertyValue('--map-marker-stroke').trim() || '#ffffff';

  return {
    markerStroke,
    labelHalo: styles.getPropertyValue('--surface').trim() || '#ffffff',
    userCore: styles.getPropertyValue('--map-user-core').trim() || DEFAULT_MARKER_COLOR,
    userStroke: styles.getPropertyValue('--map-user-stroke').trim() || markerStroke,
    userHaloOpacity: getCurrentTheme() === 'dark' ? 0.28 : 0.18,
  };
}

export function markerImageId(icon: string, color: string): string {
  return `${icon}__${color.replace(/[^a-zA-Z0-9]/g, '')}__${getCurrentTheme()}`;
}

function iconToSvgDataUrl(iconName: string): string | null {
  const svg = getColoredSvg(iconName, 'white');
  if (!svg) return null;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

async function createMarkerIcon(iconName: string, color: string, ringColor: string): Promise<ImageData> {
  const svgDataUrl = iconToSvgDataUrl(iconName);
  if (!svgDataUrl) throw new Error(`No icon found: ${iconName}`);

  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const size = 60;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;

      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = ringColor;
      ctx.stroke();

      const iconSize = size * 0.5;
      ctx.drawImage(img, (size - iconSize) / 2, (size - iconSize) / 2, iconSize, iconSize);
      resolve(ctx.getImageData(0, 0, size, size));
    };
    img.src = svgDataUrl;
  });
}

export async function ensureMarkerImages(
  map: MapboxMap,
  combos: Map<string, { icon: string; color: string }>,
): Promise<void> {
  const { markerStroke } = getMapThemeColors();

  await Promise.all(
    [...combos.values()].map(async ({ icon, color }) => {
      const id = markerImageId(icon, color);
      const imageData = await createMarkerIcon(icon, color, markerStroke);
      if (map.hasImage(id)) {
        map.updateImage(id, imageData);
      } else {
        map.addImage(id, imageData, { pixelRatio: 2 });
      }
    }),
  );
}
