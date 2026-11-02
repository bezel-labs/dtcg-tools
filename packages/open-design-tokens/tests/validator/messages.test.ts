import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SEVERITY,
  ISSUE_CODES,
  MESSAGES,
} from '../../src/validator/specs/2025.10/messages.js';

describe('message catalog', () => {
  it('every code has a message and a default severity', () => {
    for (const code of ISSUE_CODES) {
      expect(typeof MESSAGES[code]({})).toBe('string');
      expect(['error', 'warning']).toContain(DEFAULT_SEVERITY[code]);
    }
    expect(Object.keys(DEFAULT_SEVERITY).sort()).toEqual([...ISSUE_CODES].sort());
  });

  it('codes follow <section>.<field>.<problem> or <section>.<problem>', () => {
    for (const code of ISSUE_CODES) {
      expect(code).toMatch(/^[a-z]+(\.[a-z-]+){1,2}$/);
    }
  });
});
