export const MAPBOX_TOKEN =
  'pk.eyJ1IjoiY21kYWxiZW0iLCJhIjoiY2pnbXhjZnplMDJ6MjMzbnk0OGthZGE1ayJ9.n1flNO8ndRYKQcR9wNIT9w';
export const MAP_STYLE = 'mapbox://styles/cmdalbem/cmrenqask002e01qwgzs22fbh';
export const MAP_CENTER: [number, number] = [2.1734, 41.3851];
export const MAP_ZOOM = 12;
export const LABEL_ZOOM_THRESHOLD = 15;
export const MAP_FLY_PADDING = { top: 32, bottom: 100, left: 32, right: 32 };
export const DRAWER_TRANSITION_MS = 300;
export const DEFAULT_MARKER_COLOR = '#3A84B3';
export const DEFAULT_ICON = 'map-pin';

// Maps each data typology key to a Lucide icon name
export const TYPOLOGY_ICONS: Record<string, string> = {
  Bibliotecas: 'book-open',
  'Centros comerciales': 'shopping-bag',
  'Centros de culto': 'church',
  'Complejos deportivos': 'dumbbell',
  'Entidades culturales': 'drama',
  'Equipamientos ambientales': 'leaf',
  'Equipos de proximidad': 'users',
  'Espacios de juegos con agua': 'droplets',
  'Interiores de manzana': 'trees',
  Mercados: 'shopping-cart',
  Microrefugis: 'umbrella',
  Museos: 'landmark',
  'Otro(s)': 'map-pin',
  'Parques y jardines': 'flower-2',
  'Patios de escuelas': 'school',
  'Patios de guarderías': 'baby',
  Piscinas: 'waves',
  Universidades: 'graduation-cap',
};

// Radial gradient: blue (close) → green → yellow → orange → red (far)
export const DISTANCE_GRADIENT_STOPS = ['#3187B8', '#F6AF2F', '#F38D03', '#E83E25'];
export const COLOR_GRADIENT_MAX_KM = 1.5;
export const GRADIENT_LAT_MIN = 41.352;
export const GRADIENT_LAT_MAX = 41.471;
export const FONT_WEIGHT_MIN = 350;
export const FONT_WEIGHT_MAX = 850;
