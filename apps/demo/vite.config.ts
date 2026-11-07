import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // '/' on the custom domain; the Pages workflow sets VITE_BASE to the repo path otherwise.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  server: {
    fs: { allow: ['..', '../../fixtures'] },
  },
  build: {
    // Keep every script external so the CSP `script-src 'self'` holds.
    modulePreload: { polyfill: false },
    // Separate HTML files, so /playground/ loads directly from static hosting with no router.
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        playground: resolve(import.meta.dirname, 'playground/index.html'),
      },
    },
  },
});
