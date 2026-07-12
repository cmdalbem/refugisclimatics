import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('mapbox-gl')) return 'mapbox';
          if (id.includes('@waysidemapping/pinhead')) return 'mapbox';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
