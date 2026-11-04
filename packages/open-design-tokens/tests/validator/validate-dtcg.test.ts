import { describe, expect, it } from 'vitest';
import { validateDtcg } from '../../src/validator/index.js';

describe('validateDtcg', () => {
  it('accepts an empty object', () => {
    const r = validateDtcg({});
    expect(r.valid).toBe(true);
    expect(r.issues).toEqual([]);
    expect(r.spec).toBe('2025.10');
    expect(r.stats).toEqual({ tokens: 0, groups: 1, aliases: 0 });
  });

  it.each([null, undefined, 1, 'x', true, []])('rejects non-object root %p', (input) => {
    const r = validateDtcg(input === 'x' ? '"x"' : input);
    expect(r.valid).toBe(false);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]?.code).toBe('document.not-object');
    expect(r.errors[0]?.path).toEqual({ pointer: '', dot: '' });
  });

  it('parses JSON strings', () => {
    expect(validateDtcg('{}').valid).toBe(true);
  });

  it('reports invalid JSON as a diagnostic, not an exception', () => {
    const r = validateDtcg('{');
    expect(r.valid).toBe(false);
    expect(r.errors[0]?.code).toBe('document.invalid-json');
  });

  it('carries the offending primitive as meta.actual on shape errors and names it in the message', () => {
    const r = validateDtcg({ c: { $type: 'color', $value: '#zzz' } });
    const issue = r.errors[0];
    expect(issue?.code).toBe('color.value.not-object');
    if (issue?.code === 'color.value.not-object') {
      expect(issue.meta).toEqual({ actualType: 'string', actual: '#zzz' });
    }
    expect(issue?.message).toContain('received the string "#zzz"');

    // Objects and arrays are described by type only, so meta stays small.
    const arr = validateDtcg({ c: { $type: 'color', $value: [1, 2, 3] } }).errors[0];
    expect(arr?.meta).toEqual({ actualType: 'array' });
    expect(arr?.message).toContain('received "array"');
  });

  it('lets a caller override message wording by code without touching codes, paths, or meta', () => {
    const messages = {
      'color.value.not-object': ({ actual }: { actual?: unknown }) =>
        `${String(actual)} is not a color.`,
    };
    const r = validateDtcg(
      { c: { $type: 'color', $value: '#zzz' }, d: { $type: 'dimension', $value: 4 } },
      { messages },
    );
    expect(r.errors.map((i) => [i.code, i.message])).toEqual([
      ['color.value.not-object', '#zzz is not a color.'],
      [
        'dimension.value.not-object',
        'A dimension value must be an object with "value" and "unit", received the number 4.',
      ],
    ]);
    expect(r.errors[0]?.path.dot).toBe('c.$value');
    expect(r.errors[0]?.meta).toEqual({ actualType: 'string', actual: '#zzz' });
  });

  it('throws only for an unknown spec id (programmer error)', () => {
    // @ts-expect-error deliberate bad option
    expect(() => validateDtcg({}, { spec: '1999.01' })).toThrow(RangeError);
  });
});
