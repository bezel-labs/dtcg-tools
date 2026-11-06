import { defineConfig } from 'tsup';

const shared = {
  dts: true,
  sourcemap: true,
  splitting: true,
  treeshake: true,
  target: 'node20',
  platform: 'neutral',
} as const;

export default defineConfig([
  {
    ...shared,
    entry: {
      index: 'src/index.ts',
      validator: 'src/validator/index.ts',
      linter: 'src/linter/index.ts',
      types: 'src/types.ts',
    },
    format: ['esm', 'cjs'],
    clean: true,
  },
  {
    ...shared,
    entry: { cli: 'src/cli.ts' },
    format: ['esm'],
    clean: false,
  },
]);
