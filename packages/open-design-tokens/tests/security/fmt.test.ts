import { describe, expect, it } from 'vitest';
import { fmt } from '../../src/core/issue.js';
import { MAX_MESSAGE_VALUE_LENGTH } from '../../src/core/limits.js';

describe('fmt', () => {
  it('escapes control characters and ANSI sequences', () => {
    const out = fmt('\u001b[31mred\u0000\n');
    // biome-ignore lint/suspicious/noControlCharactersInRegex: asserting no control chars survive
    expect(out).not.toMatch(/[\u0000-\u001f]/);
    expect(out).toContain('\\u001b');
  });

  it('truncates long values', () => {
    const out = fmt('x'.repeat(10_000));
    expect(out.length).toBeLessThanOrEqual(MAX_MESSAGE_VALUE_LENGTH + 1);
  });

  it('never throws on unserialisable values', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => fmt(circular)).not.toThrow();
    expect(() => fmt(1n)).not.toThrow();
    expect(() => fmt(Symbol('s'))).not.toThrow();
  });
});
