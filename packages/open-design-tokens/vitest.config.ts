import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    typecheck: {
      enabled: true,
      include: ['tests/types/**/*.test-d.ts'],
      tsconfig: './tsconfig.json',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/cli.ts', 'src/types.ts', 'src/**/types/**'],
      reporter: ['text-summary', 'json-summary', 'html'],
      thresholds: {
        'src/validator/**': { lines: 90, branches: 85, functions: 90, statements: 90 },
        'src/core/**': { lines: 90, branches: 85, functions: 90, statements: 90 },
        'src/linter/**': { lines: 85, branches: 80, functions: 85, statements: 85 },
      },
    },
  },
});
