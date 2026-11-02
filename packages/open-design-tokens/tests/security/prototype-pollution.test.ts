import { describe, expect, it } from 'vitest';
import { validateDtcg } from '../../src/validator/index.js';

describe('prototype pollution', () => {
  it('does not modify Object.prototype when names are __proto__ / constructor / prototype', () => {
    const before = Object.getOwnPropertyNames(Object.prototype).sort();
    const doc = JSON.parse(
      '{"__proto__":{"polluted":{"$value":1}},"constructor":{"prototype":{"$value":2}},"prototype":{"$type":"number","$value":3}}',
    );
    validateDtcg(doc);
    validateDtcg(JSON.stringify(doc));
    expect(Object.getOwnPropertyNames(Object.prototype).sort()).toEqual(before);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});
