import { describe, expect, it } from 'vitest';
import { createResolver, prepareDocument, validateDtcg } from '../../src/validator/index.js';

const codes = (r: ReturnType<typeof validateDtcg>) =>
  r.issues.map((i) => `${i.code} ${i.path.pointer}`);

describe('alias resolution', () => {
  it('follows a 10k-long chain in linear time', () => {
    const doc: Record<string, unknown> = { t0: { $type: 'number', $value: 1 } };
    for (let i = 1; i <= 10_000; i += 1) doc[`t${i}`] = { $value: `{t${i - 1}}` };
    const start = performance.now();
    const r = validateDtcg(doc);
    const ms = performance.now() - start;
    expect(r.valid).toBe(true);
    expect(r.stats).toEqual({ tokens: 10_001, groups: 1, aliases: 10_000 });
    expect(ms).toBeLessThan(2_000);
  });

  it('reports every member of a long cycle once', () => {
    const doc: Record<string, unknown> = {};
    for (let i = 0; i < 1_000; i += 1)
      doc[`t${i}`] = { $type: 'number', $value: `{t${(i + 1) % 1_000}}` };
    const r = validateDtcg(doc);
    expect(r.errors).toHaveLength(1_000);
    expect(new Set(r.errors.map((i) => i.code))).toEqual(new Set(['alias.cycle']));
    expect(r.errors[0]?.meta?.chain).toHaveLength(1_000);
  });

  it('accepts a prepared document and reuses it', () => {
    const prepared = prepareDocument({ a: { $type: 'number', $value: 1 }, b: { $value: '{a}' } });
    const r = validateDtcg(prepared);
    expect(r.valid).toBe(true);
    expect(prepared.index.size).toBe(3);
  });

  it('resolves aliases through the merged $extends view', () => {
    const doc = {
      base: { $type: 'number', x: { $value: 1 } },
      ext: { $extends: '{base}' },
      a: { $value: '{ext.x}' },
    };
    const prepared = prepareDocument(doc);
    const resolver = createResolver(prepared);
    const res = resolver.resolveAlias('/a');
    expect(res.status).toBe('ok');
    expect(res.target?.pointer).toBe('/base/x');
    expect(validateDtcg(prepared).valid).toBe(true);
  });

  it('merged group: local tokens override, nested groups merge, type inherits', () => {
    const doc = {
      base: {
        $type: 'dimension',
        f: { w: { $value: { value: 1, unit: 'px' } }, h: { $value: { value: 2, unit: 'px' } } },
      },
      ext: { $extends: '{base}', f: { w: { $value: { value: 3, unit: 'rem' } } } },
    };
    const prepared = prepareDocument(doc);
    const resolver = createResolver(prepared);
    const view = resolver.mergedGroup('/ext', doc.ext);
    expect(view.type).toBe('dimension');
    const f = resolver.lookupPath(['ext', 'f', 'w']);
    expect(f?.originPointer).toBe('/ext/f/w');
    const h = resolver.lookupPath(['ext', 'f', 'h']);
    expect(h?.originPointer).toBe('/base/f/h');
  });

  it('never follows non-local references', () => {
    const r = validateDtcg({
      a: { $type: 'number', $value: { $ref: 'https://evil.example/x#/a' } },
    });
    expect(codes(r)).toEqual(['ref.not-local /a/$value']);
  });

  it('reports an alias into a cycle without re-reporting the cycle on it', () => {
    const r = validateDtcg({
      a: { $value: '{b}' },
      b: { $value: '{a}' },
      c: { $type: 'number', $value: '{a}' },
    });
    expect(codes(r)).toEqual([
      'alias.cycle /a/$value',
      'alias.cycle /b/$value',
      'alias.cycle /c/$value',
    ]);
  });
});
