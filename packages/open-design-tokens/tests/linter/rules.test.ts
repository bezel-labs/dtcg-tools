import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { examples, type LintConfig, lint } from '../../src/linter/index.js';

const ROOT = fileURLToPath(new URL('../../../../fixtures/2025.10/lint/', import.meta.url));

/** Every rule has a pass and a fail fixture; the fail fixture lists exactly the codes it expects. */
describe('lint rules (fixtures)', () => {
  for (const dir of readdirSync(ROOT).sort()) {
    const read = (f: string) => readFileSync(`${ROOT}${dir}/${f}`, 'utf8');
    const rawConfig = JSON.parse(read('config.json')) as LintConfig | 'example';
    const config: LintConfig =
      rawConfig === 'example'
        ? {
            rules: {
              'extensions-schema': [
                'error',
                { vendors: { 'com.example.app': examples.exampleAppSchema } },
              ],
            },
          }
        : rawConfig;
    it(`${dir}: pass fixture is clean`, () => {
      const r = lint(read('pass.json'), config);
      expect(r.validation.valid).toBe(true);
      expect(r.issues.map((i) => `${i.code} ${i.path.pointer}`)).toEqual([]);
    });
    it(`${dir}: fail fixture reports exactly the expected codes`, () => {
      const r = lint(read('fail.json'), config);
      const expected = (
        JSON.parse(read('fail.expected.json')) as { issues: { code: string; pointer: string }[] }
      ).issues;
      expect(r.validation.valid).toBe(true);
      expect(r.issues.map((i) => ({ code: i.code, pointer: i.path.pointer }))).toEqual(expected);
    });
  }
});
