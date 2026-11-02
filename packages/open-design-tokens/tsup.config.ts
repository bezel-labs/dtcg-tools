import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    validator: 'src/validator/index.ts',
    linter: 'src/linter/index.ts',
    types: 'src/types.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: true,
  treeshake: true,
  target: 'node20',
  platform: 'neutral',
});
