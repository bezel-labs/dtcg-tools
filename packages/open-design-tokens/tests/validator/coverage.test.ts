import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ISSUE_CODES } from '../../src/validator/index.js';

const FIXTURES = fileURLToPath(new URL('../../../../fixtures/2025.10/', import.meta.url));
interface Entry {
  file: string;
  spec: 'format' | 'color';
  anchor: string;
  kind: 'basic' | 'advanced' | 'invalid';
  expected?: string;
  raw?: boolean;
}
const manifest = JSON.parse(readFileSync(`${FIXTURES}manifest.json`, 'utf8')) as Entry[];

/**
 * Normative sections of the 2025.10 Format Module and Color Module that the
 * validator implements. Each must be exercised by at least one valid fixture
 * (basic or advanced) and, where the section defines rules that can be
 * broken, at least one invalid fixture.
 */
const SECTIONS: { spec: 'format' | 'color'; prefix: string; invalid: boolean; why?: string }[] = [
  { spec: 'format', prefix: 'x5-1', invalid: true },
  { spec: 'format', prefix: 'x5-2', invalid: true },
  { spec: 'format', prefix: 'x6-1', invalid: true },
  { spec: 'format', prefix: 'x6-2', invalid: true },
  { spec: 'format', prefix: 'x6-3', invalid: true },
  { spec: 'format', prefix: 'x6-4', invalid: true },
  { spec: 'format', prefix: 'x6-5', invalid: false, why: 'Empty groups are always valid.' },
  { spec: 'format', prefix: 'x6-6', invalid: true },
  { spec: 'format', prefix: 'x6-7', invalid: true },
  { spec: 'format', prefix: 'x7-1', invalid: true },
  { spec: 'format', prefix: 'x7-2', invalid: true },
  { spec: 'format', prefix: 'x7-3', invalid: true },
  { spec: 'format', prefix: 'x8-2', invalid: true },
  { spec: 'format', prefix: 'x8-3', invalid: true },
  { spec: 'format', prefix: 'x8-4', invalid: true },
  { spec: 'format', prefix: 'x8-5', invalid: true },
  { spec: 'format', prefix: 'x8-6', invalid: true },
  { spec: 'format', prefix: 'x8-7', invalid: true },
  { spec: 'format', prefix: 'x9-1', invalid: true },
  { spec: 'format', prefix: 'x9-3', invalid: true },
  { spec: 'format', prefix: 'x9-4', invalid: true },
  { spec: 'format', prefix: 'x9-5', invalid: true },
  { spec: 'format', prefix: 'x9-6', invalid: true },
  { spec: 'format', prefix: 'x9-7', invalid: true },
  { spec: 'format', prefix: 'x9-8', invalid: true },
  {
    spec: 'color',
    prefix: 'x4-1',
    invalid: false,
    why: 'Invalid color fixtures live under format x8-1-color.',
  },
  {
    spec: 'color',
    prefix: 'x4-2',
    invalid: false,
    why: 'Invalid color fixtures live under format x8-1-color.',
  },
  { spec: 'format', prefix: 'x8-1', invalid: true },
];

/** Codes that only non-JSON input can trigger; covered by unit tests instead of fixtures. */
const NON_JSON_CODES = new Set(['document.circular', 'document.unreadable-node']);

describe('spec coverage', () => {
  for (const s of SECTIONS) {
    it(`${s.spec} §${s.prefix} has valid${s.invalid ? ' and invalid' : ''} fixtures`, () => {
      const entries = manifest.filter((e) => e.spec === s.spec && e.anchor.startsWith(s.prefix));
      expect(
        entries.some((e) => e.kind !== 'invalid'),
        'valid fixture',
      ).toBe(true);
      if (s.invalid)
        expect(
          entries.some((e) => e.kind === 'invalid'),
          'invalid fixture',
        ).toBe(true);
    });
  }

  it('every issue code is exercised by a fixture (or is non-JSON only)', () => {
    const used = new Set<string>();
    for (const e of manifest) {
      if (!e.expected || !existsSync(`${FIXTURES}${e.expected}`)) continue;
      const exp = JSON.parse(readFileSync(`${FIXTURES}${e.expected}`, 'utf8')) as {
        issues: { code: string }[];
      };
      for (const i of exp.issues) used.add(i.code);
    }
    const missing = ISSUE_CODES.filter((c) => !used.has(c) && !NON_JSON_CODES.has(c));
    expect(missing).toEqual([]);
  });

  it('every expected code is a known issue code', () => {
    const known = new Set<string>(ISSUE_CODES);
    for (const e of manifest) {
      if (!e.expected) continue;
      const exp = JSON.parse(readFileSync(`${FIXTURES}${e.expected}`, 'utf8')) as {
        issues: { code: string }[];
      };
      for (const i of exp.issues) expect(known.has(i.code), `${e.file}: ${i.code}`).toBe(true);
    }
  });
});
