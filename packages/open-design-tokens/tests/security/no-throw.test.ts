import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { validateDtcg } from '../../src/validator/index.js';

describe('error contract: never throws on input', () => {
  it('arbitrary JSON values', () => {
    fc.assert(
      fc.property(fc.jsonValue(), (value) => {
        const r = validateDtcg(value);
        expect(typeof r.valid).toBe('boolean');
      }),
      { numRuns: 500 },
    );
  });

  it('arbitrary strings', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(() => validateDtcg(s)).not.toThrow();
      }),
      { numRuns: 500 },
    );
  });

  it('exotic inputs', () => {
    const exotic: unknown[] = [
      Symbol('s'),
      () => undefined,
      new Date(),
      new Uint8Array(4),
      new Map(),
      Object.create(null),
      { [Symbol('k')]: 1 },
      {
        get boom() {
          throw new Error('getter');
        },
      },
    ];
    for (const v of exotic) expect(() => validateDtcg(v)).not.toThrow();
  });
});
