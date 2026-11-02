import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as examples from '../../src/linter/examples/com.example.app.js';
import { formatGithub, formatJson, formatPretty } from '../../src/linter/formatters/index.js';
import { lintDtcg } from '../../src/linter/index.js';
import { expandFiles } from '../../src/linter/node/files.js';
import { CONFIG_FILE_NAMES, loadConfig } from '../../src/linter/node/load-config.js';

const num = (v: unknown, extra: Record<string, unknown> = {}) => ({
  $type: 'number',
  $value: v,
  ...extra,
});
const codes = (r: ReturnType<typeof lintDtcg>) =>
  r.issues.map((i) => `${i.code} ${i.path.pointer}`);

describe('loadConfig', () => {
  it('returns an empty config when nothing is found', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cfg-'));
    expect(await loadConfig(dir)).toEqual({ config: {}, path: undefined });
  });

  it('loads JSON, mjs, and explicit paths; rejects missing and non-object files', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'cfg-'));
    writeFileSync(
      join(dir, CONFIG_FILE_NAMES[0]),
      JSON.stringify({ rules: { 'no-empty-groups': 'error' } }),
    );
    expect((await loadConfig(dir)).config.rules).toEqual({ 'no-empty-groups': 'error' });

    const mjs = join(dir, 'custom.config.mjs');
    writeFileSync(mjs, "export default { rules: { 'require-description': 'warning' } };");
    expect((await loadConfig(dir, mjs)).config.rules).toEqual({ 'require-description': 'warning' });
    expect((await loadConfig(dir, 'custom.config.mjs')).path).toBe(mjs);

    await expect(loadConfig(dir, 'missing.json')).rejects.toThrow(/not found/);
    writeFileSync(join(dir, 'bad.json'), '[]');
    await expect(loadConfig(dir, 'bad.json')).rejects.toThrow(/must contain an object/);
    writeFileSync(join(dir, 'bad.mjs'), 'export default 42;');
    await expect(loadConfig(dir, 'bad.mjs')).rejects.toThrow(/must export an object/);
  });
});

describe('example vendor schema', () => {
  it('validateExportName and validateVariantName', () => {
    expect(examples.validateExportName(['pool-100'])).toBeUndefined();
    expect(examples.validateExportName('x')).toMatch(/array/);
    expect(examples.validateExportName(['Bad Name'])).toMatch(/must be 1 to 64/);
    expect(examples.validateExportName(['x'.repeat(65)])).toMatch(/must be 1 to 64/);
    expect(examples.validateVariantName('dark')).toBeUndefined();
    expect(examples.validateVariantName('')).toMatch(/must be 1 to 64/);
    expect(examples.validateVariantName(3)).toMatch(/must be 1 to 64/);
  });
});

describe('extensions-schema field specs', () => {
  const schema = {
    fields: {
      count: { type: 'number' as const, min: 1, max: 10 },
      flag: { type: 'boolean' as const, required: true },
      tags: { type: 'array' as const, items: 'string' as const, min: 1, max: 2 },
      meta: {
        type: 'object' as const,
        validate: (v: unknown) =>
          v && typeof v === 'object' && 'ok' in v ? undefined : 'needs ok',
      },
    },
    additionalFields: true,
  };
  const config = {
    rules: { 'extensions-schema': ['error', { vendors: { 'com.example.x': schema } }] as const },
  };

  it('reports numeric bounds, missing required, array sizes and item types, and custom validators', () => {
    const r = lintDtcg(
      {
        t: num(1, {
          $extensions: {
            'com.example.x': { count: 11, tags: [1, 'a', 'b'], meta: {}, extra: true },
          },
        }),
      },
      config,
    );
    expect(codes(r)).toEqual([
      'extensions-schema.too-large /t/$extensions/com.example.x/count',
      'extensions-schema.missing /t/$extensions/com.example.x',
      'extensions-schema.too-many /t/$extensions/com.example.x/tags',
      'extensions-schema.wrong-type /t/$extensions/com.example.x/tags/0',
      'extensions-schema.invalid /t/$extensions/com.example.x/meta',
    ]);
  });

  it('reports too-small, too-few, and wrong top-level types', () => {
    const r = lintDtcg(
      { t: num(1, { $extensions: { 'com.example.x': { count: 0, flag: 'yes', tags: [] } } }) },
      config,
    );
    expect(codes(r)).toEqual([
      'extensions-schema.too-small /t/$extensions/com.example.x/count',
      'extensions-schema.wrong-type /t/$extensions/com.example.x/flag',
      'extensions-schema.too-few /t/$extensions/com.example.x/tags',
    ]);
  });

  it('supports function vendors and ignores vendors absent from the block', () => {
    const fn = (value: unknown, path: readonly string[]) =>
      value === 'ok' ? [] : [{ code: 'custom', message: 'not ok', path }];
    const r = lintDtcg(
      { t: num(1, { $extensions: { 'com.example.fn': 'nope', 'com.example.other': 1 } }) },
      {
        rules: {
          'extensions-schema': [
            'warning',
            { vendors: { 'com.example.fn': fn, 'com.example.missing': schema } },
          ],
        },
      },
    );
    expect(codes(r)).toEqual(['extensions-schema.custom /t/$extensions/com.example.fn']);
    expect(r.issues[0]?.severity).toBe('warning');
  });
});

describe('naming presets', () => {
  it('pascal and snake', () => {
    const r = lintDtcg(
      {
        MyGroup: { $type: 'number', my_token: { $value: 1 }, badToken: { $value: 2 } },
        bad_group: {},
      },
      { rules: { 'naming-convention': ['error', { tokens: 'snake', groups: 'pascal' }] } },
    );
    expect(codes(r)).toEqual([
      'naming-convention.mismatch /MyGroup/badToken',
      'naming-convention.mismatch /bad_group',
    ]);
  });
});

describe('formatter branches', () => {
  const clean = lintDtcg({ a: num(1) });
  it('pretty with no issues, colored and plain; json without file; github empty', () => {
    expect(formatPretty(clean, { color: true })).toContain('no issues');
    expect(formatPretty(clean)).toContain('0 errors, 0 warnings');
    expect(JSON.parse(formatJson(clean)).valid).toBe(true);
    expect(formatGithub(clean)).toBe('');
  });
  it('pretty counts skipped checks and github omits file when absent', () => {
    const r = lintDtcg({ a: num('x') }, { rules: { 'require-description': 'error' } });
    expect(formatPretty(r)).toContain('1 rule check skipped');
    expect(formatGithub(r)).toMatch(/^::error title=/);
  });
});

describe('expandFiles', () => {
  it('returns plain paths as given and dedupes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'files-'));
    writeFileSync(join(dir, 'a.json'), '{}');
    expect(expandFiles(['a.json', 'a.json', './a.json'], dir)).toEqual([join(dir, 'a.json')]);
    expect(expandFiles(['*.json', 'x?json'], dir)).toEqual([join(dir, 'a.json')]);
    expect(expandFiles(['nope/*.json'], dir)).toEqual([]);
  });
});
