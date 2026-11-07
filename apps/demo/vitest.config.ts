import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.tsx'],
    // App renders are DOM-heavy, and CI runners can take over 5 seconds on the first one.
    testTimeout: 20_000,
  },
});
