import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const siteUrl = (env.VITE_SITE_URL ?? 'https://refugisclimatics.cat').replace(/\/$/, '');
  const metaDescription =
    'Mapa interactiu dels refugis climàtics de Barcelona. Troba biblioteques, parcs, piscines i més per protegir-te de la calor, ordenats per distància.';
  const ogImageWidth = 1384;
  const ogImageHeight = 742;

  return {
    plugins: [
      react(),
      {
        name: 'html-seo',
        transformIndexHtml(html: string) {
          return html
            .replaceAll('__SITE_URL__', siteUrl)
            .replaceAll('__META_DESCRIPTION__', metaDescription)
            .replaceAll('__OG_IMAGE_WIDTH__', String(ogImageWidth))
            .replaceAll('__OG_IMAGE_HEIGHT__', String(ogImageHeight));
        },
      },
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('mapbox-gl')) return 'mapbox';
            if (id.includes('@waysidemapping/pinhead')) return 'mapbox';
            if (id.includes('node_modules')) return 'vendor';
          },
        },
      },
    },
  };
});
