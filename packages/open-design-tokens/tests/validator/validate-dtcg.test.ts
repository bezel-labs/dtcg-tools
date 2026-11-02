import { describe, expect, it } from 'vitest';
import { validate, validateDtcg } from '../../src/validator/index.js';

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

  it('throws only for an unknown spec id (programmer error)', () => {
    // @ts-expect-error deliberate bad option
    expect(() => validateDtcg({}, { spec: '1999.01' })).toThrow(RangeError);
  });

  it('exports validate as an alias', () => {
    expect(validate).toBe(validateDtcg);
  });
});
