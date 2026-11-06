import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as examples from '../../src/linter/examples/com.example.app.js';
import { createLinter, type LintConfig } from '../../src/linter/index.js';

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
    const linter = createLinter(config);
    it(`${dir}: pass fixture is clean`, () => {
      const r = linter.lint(read('pass.json'));
      expect(r.validation.valid).toBe(true);
      expect(r.issues.map((i) => `${i.code} ${i.path.pointer}`)).toEqual([]);
    });
    it(`${dir}: fail fixture reports exactly the expected codes`, () => {
      const r = linter.lint(read('fail.json'));
      const expected = (
        JSON.parse(read('fail.expected.json')) as { issues: { code: string; pointer: string }[] }
      ).issues;
      expect(r.validation.valid).toBe(true);
      expect(r.issues.map((i) => ({ code: i.code, pointer: i.path.pointer }))).toEqual(expected);
    });
  }
});
