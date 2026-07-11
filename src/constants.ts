export const MAPBOX_TOKEN =
  'pk.eyJ1IjoiY21kYWxiZW0iLCJhIjoiY2pnbXhjZnplMDJ6MjMzbnk0OGthZGE1ayJ9.n1flNO8ndRYKQcR9wNIT9w';
export const MAP_STYLE = 'mapbox://styles/cmdalbem/cmrenqask002e01qwgzs22fbh';
export const MAP_CENTER: [number, number] = [2.1734, 41.3851];
export const MAP_ZOOM = 12;
export const LABEL_ZOOM_THRESHOLD = 15;
export const MAP_FLY_PADDING = { top: 32, bottom: 100, left: 32, right: 32 };
export const MAP_FLY_PADDING_MOBILE_DRAWER = { top: 32, bottom: 260, left: 32, right: 32 };
export const DRAWER_TRANSITION_MS = 300;
export const DEFAULT_MARKER_COLOR = '#3A84B3';
export const DEFAULT_ICON = 'map_pin';
export const FILTER_ALL_ICON = 'map_outline';

// Maps each data typology key to a Pinhead icon id
export const TYPOLOGY_ICONS: Record<string, string> = {
  Bibliotecas: 'book',
  'Centros comerciales': 'shopping_bag',
  'Centros de culto': 'chapel',
  'Complejos deportivos': 'dumbbell',
  'Entidades culturales': 'comedy_mask',
  'Equipamientos ambientales': 'leaf',
  'Equipos de proximidad': 'lowrise_building',
  'Espacios de juegos con agua': 'droplet',
  'Interiores de manzana': 'bench_with_backrest',
  Mercados: 'shopping_cart',
  Microrefugis: 'table_with_umbrella',
  Museos: 'classical_building',
  'Otro(s)': 'map_pin',
  'Parques y jardines': 'conifer_tree',
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
export const FONT_WEIGHT_MIN = 350;
export const FONT_WEIGHT_MAX = 850;
