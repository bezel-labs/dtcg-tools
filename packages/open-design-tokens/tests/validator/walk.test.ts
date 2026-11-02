import { describe, expect, it } from 'vitest';
import { MAX_DEPTH, validateDtcg } from '../../src/validator/index.js';

describe('document walk', () => {
  it('counts tokens, groups, and aliases', () => {
    const r = validateDtcg({
      a: { $type: 'number', $value: 1 },
      g: {
        b: { $type: 'number', $value: 2 },
        c: { $value: '{a}' },
        d: { $value: { $ref: '#/a/$value' } },
      },
    });
    expect(r.valid).toBe(true);
    expect(r.stats).toEqual({ tokens: 4, groups: 2, aliases: 2 });
  });

  it('inherits $type from the nearest group', () => {
    const r = validateDtcg({
      $type: 'number',
      g: { $type: 'dimension', t: { $value: 1 } },
      n: { $value: 'x' },
    });
    expect(r.issues.map((i) => [i.code, i.path.pointer])).toEqual([
      ['dimension.value.not-object', '/g/t/$value'],
      ['number.value.not-number', '/n/$value'],
    ]);
  });

  it('reports document.too-deep instead of overflowing the stack', () => {
    let doc: Record<string, unknown> = { $type: 'number', $value: 1 };
    for (let i = 0; i < MAX_DEPTH + 50; i += 1) doc = { g: doc };
    const r = validateDtcg(doc);
    expect(r.errors.map((i) => i.code)).toEqual(['document.too-deep']);
  });

  it('reports a circular object graph', () => {
    const doc: Record<string, unknown> = {};
    doc.self = doc;
    const r = validateDtcg(doc);
    expect(r.errors.map((i) => i.code)).toEqual(['document.circular']);
  });

  it('turns a throwing getter into a diagnostic', () => {
    const doc = {
      get boom() {
        throw new Error('nope');
      },
    };
    const r = validateDtcg(doc);
    expect(r.errors.map((i) => [i.code, i.path.pointer])).toEqual([
      ['document.unreadable-node', '/boom'],
    ]);
  });

  it('issues come out in document order', () => {
    const r = validateDtcg({
      z: { $type: 'number', $value: 'a' },
      a: { $type: 'number', $value: 'b' },
    });
    expect(r.issues.map((i) => i.path.pointer)).toEqual(['/z/$value', '/a/$value']);
  });
});
