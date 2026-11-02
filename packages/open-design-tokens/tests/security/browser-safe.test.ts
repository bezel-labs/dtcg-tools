import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { describe, expect, it } from 'vitest';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));

/** The validator and linter entries must bundle for the browser with no Node builtins. */
describe('browser-safe entries', () => {
  for (const entry of ['validator/index.ts', 'linter/index.ts']) {
    it(`${entry} bundles for platform=browser`, async () => {
      const result = await build({
        entryPoints: [`${SRC}${entry}`],
        bundle: true,
        platform: 'browser',
        format: 'esm',
        write: false,
        logLevel: 'silent',
      });
      const code = result.outputFiles[0]?.text ?? '';
      expect(code.length).toBeGreaterThan(1000);
      expect(code).not.toMatch(/from\s*["']node:/);
      expect(code).not.toMatch(/require\(["']node:/);
      expect(code).not.toMatch(/\bprocess\.env\b/);
    });
  }

  it('the validator entry pulls in no linter code', async () => {
    const result = await build({
      entryPoints: [`${SRC}validator/index.ts`],
      bundle: true,
      platform: 'browser',
      format: 'esm',
      write: false,
      logLevel: 'silent',
      metafile: true,
    });
    const inputs = Object.keys(result.metafile?.inputs ?? {});
    expect(inputs.some((f) => f.includes('/linter/'))).toBe(false);
  });
});
