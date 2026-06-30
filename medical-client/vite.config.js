import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// El dev server corre en el puerto 4200 (ya permitido por el CORS del backend)
// y proxea /api y /socket.io al backend en :3000 para evitar CORS en desarrollo.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 4200,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
});
