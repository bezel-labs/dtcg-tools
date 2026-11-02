import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  // Served from the root of a custom domain (see plan: Demo hosting).
  base: '/',
  plugins: [react()],
  server: {
    fs: { allow: ['..', '../../fixtures'] },
  },
  build: {
    // Keep every script external so the CSP `script-src 'self'` holds.
    modulePreload: { polyfill: false },
  },
});
