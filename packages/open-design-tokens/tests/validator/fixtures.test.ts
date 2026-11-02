import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateDtcg } from '../../src/validator/index.js';

const FIXTURES = fileURLToPath(new URL('../../../../fixtures/2025.10/', import.meta.url));

interface ManifestEntry {
  file: string;
  spec: 'format' | 'color';
  section: string;
  anchor: string;
  example?: number;
  kind: 'basic' | 'advanced' | 'invalid';
  verbatim: boolean;
  cleaned?: string[];
  notes?: string;
  expected?: string;
  /** The file is deliberately not JSON (parse-error fixture). */
  raw?: boolean;
}

interface Expected {
  valid: boolean;
  issues: { code: string; pointer: string; severity: 'error' | 'warning' }[];
}

const manifest = JSON.parse(readFileSync(`${FIXTURES}manifest.json`, 'utf8')) as ManifestEntry[];

describe('fixture manifest', () => {
  it('every fixture file exists and parses', () => {
    for (const entry of manifest) {
      expect(existsSync(`${FIXTURES}${entry.file}`), entry.file).toBe(true);
      if (!entry.raw) JSON.parse(readFileSync(`${FIXTURES}${entry.file}`, 'utf8'));
      if (entry.expected)
        expect(existsSync(`${FIXTURES}${entry.expected}`), entry.expected).toBe(true);
    }
  });

  it('invalid fixtures always declare an expected file', () => {
    for (const entry of manifest.filter((e) => e.kind === 'invalid')) {
      expect(entry.expected, entry.file).toBeDefined();
    }
  });

  it('files are unique', () => {
    const files = manifest.map((e) => e.file);
    expect(new Set(files).size).toBe(files.length);
  });
});

describe.each(manifest)('$file', (entry) => {
  it(`${entry.kind} · ${entry.section}${entry.example ? ` · Example ${entry.example}` : ''}`, () => {
    const source = readFileSync(`${FIXTURES}${entry.file}`, 'utf8');
    const result = validateDtcg(source);
    const observed: Expected = {
      valid: result.valid,
      issues: result.issues.map((i) => ({
        code: i.code,
        pointer: i.path.pointer,
        severity: i.severity,
      })),
    };
    if (entry.expected) {
      const expected = JSON.parse(readFileSync(`${FIXTURES}${entry.expected}`, 'utf8')) as Expected;
      expect(observed).toEqual(expected);
    } else {
      expect(observed).toEqual({ valid: true, issues: [] });
    }
  });
});
