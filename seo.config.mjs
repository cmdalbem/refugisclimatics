export const SITE_URL = (process.env.VITE_SITE_URL ?? 'https://refugisclimatics.cat').replace(
  /\/$/,
  '',
);

export const META_DESCRIPTION =
  'Mapa interactiu dels refugis climàtics de Barcelona. Troba biblioteques, parcs, piscines i més per protegir-te de la calor, ordenats per distància.';

export const OG_IMAGE_WIDTH = 1384;
export const OG_IMAGE_HEIGHT = 742;
