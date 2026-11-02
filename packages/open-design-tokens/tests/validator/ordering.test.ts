import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { prepareDocument, validateDtcg } from '../../src/validator/index.js';

const FIXTURES = fileURLToPath(new URL('../../../../fixtures/2025.10/', import.meta.url));
const manifest = JSON.parse(readFileSync(`${FIXTURES}manifest.json`, 'utf8')) as {
  file: string;
  raw?: boolean;
}[];

function rankOf(index: Map<string, unknown>, pointer: string): number {
  const keys = [...index.keys()];
  let p = pointer;
  for (;;) {
    const r = keys.indexOf(p);
    if (r >= 0) return r;
    const cut = p.lastIndexOf('/');
    if (cut < 0) return -1;
    p = p.slice(0, cut);
  }
}

describe('deterministic issue order', () => {
  it('issues follow document order for every fixture', () => {
    for (const e of manifest) {
      const source = readFileSync(`${FIXTURES}${e.file}`, 'utf8');
      const doc = prepareDocument(source);
      const ranks = validateDtcg(doc).issues.map((i) => rankOf(doc.index, i.path.pointer));
      for (let i = 1; i < ranks.length; i += 1) {
        expect(ranks[i], `${e.file} issue ${i}`).toBeGreaterThanOrEqual(ranks[i - 1] as number);
      }
    }
  });

  it('is stable across repeated runs and input forms', () => {
    const doc = {
      z: { $type: 'number', $value: 'x' },
      a: { $value: '{z}' },
      g: { b: { $value: 1 } },
    };
    const a = validateDtcg(doc).issues.map((i) => `${i.code}@${i.path.pointer}`);
    const b = validateDtcg(JSON.stringify(doc)).issues.map((i) => `${i.code}@${i.path.pointer}`);
    const c = validateDtcg(prepareDocument(doc)).issues.map((i) => `${i.code}@${i.path.pointer}`);
    expect(a).toEqual(b);
    expect(a).toEqual(c);
    expect(a).toEqual(['number.value.not-number@/z/$value', 'token.type.missing@/g/b']);
  });
});
