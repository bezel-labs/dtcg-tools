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
  },
});
