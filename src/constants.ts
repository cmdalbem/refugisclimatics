export const APP_TITLE = 'Refugis Climàtics';
export const APP_PAGE_TITLE = `${APP_TITLE} — Barcelona`;

export const MAPBOX_TOKEN =
  'pk.eyJ1IjoiY21kYWxiZW0iLCJhIjoiY2pnbXhjZnplMDJ6MjMzbnk0OGthZGE1ayJ9.n1flNO8ndRYKQcR9wNIT9w';
export const MAP_STYLE = 'mapbox://styles/cmdalbem/cmrenqask002e01qwgzs22fbh';
export const MAP_BASEMAP_IMPORT_ID = 'basemap';

export function mapBasemapConfigForTheme(theme: 'light' | 'dark') {
  return theme === 'dark'
    ? { lightPreset: 'night', theme: 'monochrome' }
    : { lightPreset: 'day', theme: 'faded' };
}
export const OFFICIAL_SHELTER_NETWORK_URL =
  'https://www.barcelona.cat/barcelona-pel-clima/es/acciones-concretas/red-de-refugios-climaticos';

const MICROREFUGIS_FAQ_URLS: Record<string, string> = {
  ca: 'https://www.barcelona.cat/barcelona-pel-clima/ca/accions-concretes/xarxa-de-refugis-climatics#i-com-es-un-microrefugi-climatic',
  es: 'https://www.barcelona.cat/barcelona-pel-clima/es/acciones-concretas/red-de-refugios-climaticos#y-como-es-un-microrrefugio-climatico',
};

export function microrefugisFaqUrl(language: string): string {
  const code = language.split('-')[0];
  return MICROREFUGIS_FAQ_URLS[code] ?? MICROREFUGIS_FAQ_URLS.es;
}

export function mapCustomAttribution(label: string): string {
  return `<a href="${OFFICIAL_SHELTER_NETWORK_URL}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}
export const MAP_CENTER: [number, number] = [2.1734, 41.3851];
export const MAP_ZOOM = 12;
export const LABEL_ZOOM_THRESHOLD = 15;
export const MAP_FLY_PADDING = { top: 80, bottom: 32, left: 32, right: 32 };
export const MAP_FLY_PADDING_MOBILE_DRAWER = { top: 32, bottom: 260, left: 32, right: 32 };
export const DRAWER_TRANSITION_MS = 300;
export const DEFAULT_MARKER_COLOR = '#3A84B3';
export const DEFAULT_ICON = 'map_pin';

// Maps each data typology key to a Pinhead icon id
// Priority order for amenity characteristics in detail views (positive only).
export const PRIORITY_CHARACTERISTICS = [
  'Con lavabo',
  'Amb aigua per beure',
  'Con internet para uso público',
  'Puntos de conexión Barcelona WiFi',
  'Accesible para personas con discapacidad física',
  'Se admiten animales de compañía',
];

export const CHARACTERISTIC_ICONS: Record<string, string> = {
  'Con lavabo': 'womens_and_mens_restroom_symbol',
  'Amb aigua per beure': 'droplet',
  'Con internet para uso público': 'wifi',
  'Puntos de conexión Barcelona WiFi': 'wifi',
  'Accesible para personas con discapacidad física': 'international_wheelchair_symbol',
  'Se admiten animales de compañía': 'dog_sitting',
};

export function priorityAmenityIcons(
  characteristics: string[] | undefined,
): { key: string; icon: string }[] {
  if (!characteristics?.length) return [];
  const available = new Set(characteristics);
  const icons: { key: string; icon: string }[] = [];
  const seenIcons = new Set<string>();
  for (const key of PRIORITY_CHARACTERISTICS) {
    if (!available.has(key)) continue;
    const icon = CHARACTERISTIC_ICONS[key];
    if (!icon || seenIcons.has(icon)) continue;
    icons.push({ key, icon });
    seenIcons.add(icon);
  }
  return icons;
}

export const TYPOLOGY_ICONS: Record<string, string> = {
  Bibliotecas: 'open_book',
  'Centros comerciales': 'shopping_basket',
  'Centros de culto': 'chapel',
  'Complejos deportivos': 'barbell',
  'Entidades culturales': 'comedy_mask_and_tragedy_mask',
  'Equipamientos ambientales': 'maple_leaf',
  'Equipos de proximidad': 'house_with_chimney',
  'Espacios de juegos con agua': 'fountain_from_water',
  'Interiores de manzana': 'tree_and_bench_with_backrest',
  Mercados: 'shopping_cart',
  Microrefugis: 'commercial_building',
  Museos: 'classical_building',
  'Otro(s)': 'map_pin',
  'Parques y jardines': 'tree_row',
  'Patios de escuelas': 'play_structure_with_slide',
  'Patios de guarderías': 'baby',
  Piscinas: 'person_swimming_in_water',
  Universidades: 'square_academic_cap',
};

// Radial gradient: blue (close) → green → yellow → orange → red (far)
export const DISTANCE_GRADIENT_STOPS = ['#3187B8', '#F6AF2F', '#F38D03', '#E83E25'];
export const COLOR_GRADIENT_MAX_KM = 1.5;
export const GRADIENT_LAT_MIN = 41.352;
export const GRADIENT_LAT_MAX = 41.471;
export const FONT_GRADIENT_MIN_KM = 0.5;
export const FONT_GRADIENT_MAX_KM = 0.8;
export const FONT_WEIGHT_MIN = 250;
export const FONT_WEIGHT_MAX = 850;
