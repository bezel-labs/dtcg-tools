import { describe, expect, it } from 'vitest';
import {
  createResolver,
  prepareDocument,
  validateAliasToken,
  validateDtcg,
} from '../../src/validator/index.js';

const codes = (r: ReturnType<typeof validateDtcg>) =>
  r.issues.map((i) => `${i.code} ${i.path.pointer}`);

describe('alias resolution', () => {
  it('follows a 10k-long chain in linear time', () => {
    const chain = (n: number): Record<string, unknown> => {
      const doc: Record<string, unknown> = { t0: { $type: 'number', $value: 1 } };
      for (let i = 1; i <= n; i += 1) doc[`t${i}`] = { $value: `{t${i - 1}}` };
      return doc;
    };
    const time = (doc: Record<string, unknown>) => {
      validateDtcg(doc); // warm up
      const start = performance.now();
      const r = validateDtcg(doc);
      expect(r.valid).toBe(true);
      return performance.now() - start;
    };
    const small = time(chain(2_000));
    const large = time(chain(10_000));
    expect(validateDtcg(chain(10_000)).stats).toEqual({
      tokens: 10_001,
      groups: 1,
      aliases: 10_000,
    });
    // Linear: 5x the chain should cost far less than 25x. Generous for slow, coverage-instrumented
    // CI runners; a quadratic regression blows past this immediately.
    expect(large / Math.max(small, 1)).toBeLessThan(20);
    expect(large).toBeLessThan(15_000);
  });

  it('reports every member of a long cycle once', () => {
    const doc: Record<string, unknown> = {};
    for (let i = 0; i < 1_000; i += 1)
      doc[`t${i}`] = { $type: 'number', $value: `{t${(i + 1) % 1_000}}` };
    const r = validateDtcg(doc);
    expect(r.errors).toHaveLength(1_000);
    expect(new Set(r.errors.map((i) => i.code))).toEqual(new Set(['alias.cycle']));
    const first = r.errors[0];
    expect(first?.code === 'alias.cycle' ? first.meta?.chain : undefined).toHaveLength(1_000);
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

describe('public alias helpers', () => {
  const doc = {
    base: { $type: 'number', $value: 1 },
    a: { $value: '{base}' },
    c: { $type: 'color', $value: '{base}' },
    r: { $ref: '#/base' },
    frag: { $type: 'dimension', $value: { value: { $ref: '#/base/$value' }, unit: 'px' } },
    bad: { $type: 'dimension', $value: { value: { $ref: '#/nope' }, unit: 'px' } },
  };

  it('validateAliasToken checks a token by pointer with inferred or explicit type', () => {
    expect(validateAliasToken(doc, '/a')).toMatchObject({
      resolved: true,
      resolvedType: 'number',
      issues: [],
    });
    expect(validateAliasToken(doc, '/c').issues.map((i) => i.code)).toEqual([
      'alias.type.mismatch',
    ]);
    expect(validateAliasToken(doc, '/a', 'color').issues.map((i) => i.code)).toEqual([
      'alias.type.mismatch',
    ]);
    expect(validateAliasToken(doc, '/r').issues[0]?.path.pointer ?? 'none').toBe('none');
    expect(validateAliasToken(doc, '/missing').issues.map((i) => i.code)).toEqual([
      'alias.target.missing',
    ]);
    expect(validateAliasToken(JSON.stringify(doc), '/a').resolved).toBe(true);
  });

  it('resolver.dereference replaces nested $ref fragments and reports failures under $value', () => {
    const resolver = createResolver(prepareDocument(doc));
    const ok = resolver.dereference(doc.frag.$value, '/frag');
    expect(ok).toMatchObject({ failed: false, issues: [], value: { value: 1, unit: 'px' } });
    const bad = resolver.dereference(doc.bad.$value, '/bad');
    expect(bad.failed).toBe(true);
    expect(bad.issues.map((i) => `${i.code} ${i.path.pointer}`)).toEqual([
      'ref.target.missing /bad/$value/value',
    ]);
  });
});
