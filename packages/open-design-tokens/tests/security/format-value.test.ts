import { describe, expect, it } from 'vitest';
import { formatValue } from '../../src/core/issue.js';
import { MAX_MESSAGE_VALUE_LENGTH } from '../../src/core/limits.js';

describe('formatValue', () => {
  it('escapes control characters and ANSI sequences', () => {
    const out = formatValue('\u001b[31mred\u0000\n');
    // biome-ignore lint/suspicious/noControlCharactersInRegex: asserting no control chars survive
    expect(out).not.toMatch(/[\u0000-\u001f]/);
    expect(out).toContain('\\u001b');
  });

  it('truncates long values', () => {
    const out = formatValue('x'.repeat(10_000));
    expect(out.length).toBeLessThanOrEqual(MAX_MESSAGE_VALUE_LENGTH + 1);
  });

  it('never throws on unserialisable values', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => formatValue(circular)).not.toThrow();
    expect(() => formatValue(1n)).not.toThrow();
    expect(() => formatValue(Symbol('s'))).not.toThrow();
  });
});
