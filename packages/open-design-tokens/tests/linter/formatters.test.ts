import { describe, expect, it } from 'vitest';
import {
  encodeCommandValue,
  formatGithub,
  formatJson,
  formatPretty,
  stripControl,
} from '../../src/linter/formatters/index.js';
import { lint } from '../../src/linter/index.js';

const HOSTILE = '\u001b[31mevil\u001b[0m\n::set-output name=x::y%0A';

describe('formatters', () => {
  const result = lint(
    { [HOSTILE]: { $type: 'number', $value: 'x' }, ok: { $type: 'number', $value: 1 } },
    { rules: { 'require-description': 'warning' } },
  );

  it('pretty output contains no control characters or ANSI sequences from the document', () => {
    const out = formatPretty(result, { file: `tok\u001b[2Jens.json`, color: false });
    // biome-ignore lint/suspicious/noControlCharactersInRegex: asserting none survive
    expect(out).not.toMatch(/[\u0000-\u0008\u000b-\u001f\u007f]/);
    expect(out).toContain('number.value.not-number');
    expect(out).toContain('1 error, 1 warning');
  });

  it('pretty output colors only when asked', () => {
    expect(formatPretty(result, { color: true })).toContain('\u001b[31m');
    expect(formatPretty(result, { color: false })).not.toContain('\u001b[');
  });

  it('github output encodes workflow-command characters so names cannot forge commands', () => {
    const out = formatGithub(result, { file: 'a,b:c.json' });
    const lines = out.trim().split('\n');
    // One line per issue: the injected newline is encoded, so "::set-output" can
    // never start a line and is inert inside the message.
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      expect(line).toMatch(/^::(error|warning) file=a%2Cb%3Ac\.json,title=[^:]*::/);
      expect(line.startsWith('::set-output')).toBe(false);
      expect(line).not.toContain('\r');
    }
    expect(encodeCommandValue('100%\r\n', true)).toBe('100%25%0D%0A');
    expect(encodeCommandValue('a:b,c', true)).toBe('a%3Ab%2Cc');
  });

  it('json output round-trips', () => {
    const parsed = JSON.parse(formatJson(result, { file: 'x.json' })) as {
      file: string;
      valid: boolean;
      issues: unknown[];
    };
    expect(parsed.file).toBe('x.json');
    expect(parsed.valid).toBe(false);
    expect(parsed.issues).toHaveLength(1);
  });

  it('stripControl removes C0, DEL, and C1 characters', () => {
    expect(stripControl('a\u0000b\u001bc\u007fd\u0085e')).toBe('abcde');
  });
});
