import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { expandFiles, globToRegExp } from '../../src/linter/node/files.js';

const CLI = fileURLToPath(new URL('../../dist/cli.js', import.meta.url));
const run = (args: string[], cwd: string) =>
  spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1' },
  });

function project(): string {
  const dir = mkdtempSync(join(tmpdir(), 'dtcg-lint-'));
  mkdirSync(join(dir, 'tokens'));
  writeFileSync(
    join(dir, 'tokens', 'good.json'),
    JSON.stringify({ a: { $type: 'number', $value: 1, $description: 'd' } }),
  );
  writeFileSync(
    join(dir, 'tokens', 'bad.json'),
    JSON.stringify({ a: { $type: 'number', $value: 'x' } }),
  );
  writeFileSync(
    join(dir, 'tokens', 'policy.json'),
    JSON.stringify({ a: { $type: 'number', $value: 1 } }),
  );
  return dir;
}

describe('dtcg-lint CLI (built dist)', () => {
  it('prints usage and exits 2 without files', () => {
    const r = run([], project());
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('Usage');
  });

  it('accepts --no-color and every documented flag', () => {
    const dir = project();
    const r = run(['tokens/bad.json', '--no-color', '--format', 'pretty'], dir);
    expect(r.stderr).toBe('');
    expect(r.status).toBe(1);
    expect(r.stdout).not.toContain('\u001b[');
    expect(run(['--help'], dir).status).toBe(0);
  });

  it('exits 0 for a valid file and 1 for an invalid one', () => {
    const dir = project();
    expect(run(['tokens/good.json'], dir).status).toBe(0);
    const bad = run(['tokens/bad.json'], dir);
    expect(bad.status).toBe(1);
    expect(bad.stdout).toContain('number.value.not-number');
  });

  it('loads dtcg-lint.config.json from cwd only and applies rules', () => {
    const dir = project();
    writeFileSync(
      join(dir, 'dtcg-lint.config.json'),
      JSON.stringify({ rules: { 'require-description': 'error' } }),
    );
    expect(run(['tokens/policy.json'], dir).status).toBe(1);
    // From a subdirectory there is no parent walk, so the policy does not apply.
    expect(run(['policy.json'], join(dir, 'tokens')).status).toBe(0);
    // Explicit --config works from anywhere.
    expect(
      run(['policy.json', '--config', join(dir, 'dtcg-lint.config.json')], join(dir, 'tokens'))
        .status,
    ).toBe(1);
  });

  it('json and github formats are machine-parseable', () => {
    const dir = project();
    const json = run(['tokens/bad.json', '--format', 'json'], dir);
    expect(() => JSON.parse(json.stdout)).not.toThrow();
    const gh = run(['tokens/bad.json', '--format', 'github'], dir);
    expect(gh.stdout).toMatch(/^::error file=tokens\/bad\.json,title=/);
  });

  it('rejects an unknown format and a broken config with exit 2', () => {
    const dir = project();
    expect(run(['tokens/good.json', '--format', 'xml'], dir).status).toBe(2);
    writeFileSync(join(dir, 'dtcg-lint.config.json'), JSON.stringify({ rules: { nope: 'error' } }));
    const r = run(['tokens/good.json'], dir);
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('Unknown lint rule');
  });

  describe('--max-warnings', () => {
    // Two files with one `require-description` warning each: two warnings in total.
    function warned(): string {
      const dir = project();
      writeFileSync(
        join(dir, 'dtcg-lint.config.json'),
        JSON.stringify({ rules: { 'require-description': 'warning' } }),
      );
      writeFileSync(
        join(dir, 'tokens', 'policy-two.json'),
        JSON.stringify({ b: { $type: 'number', $value: 2 } }),
      );
      return dir;
    }
    const both = ['tokens/policy.json', 'tokens/policy-two.json'];

    it('passes warnings by default and when they are under or at the limit', () => {
      const dir = warned();
      expect(run(both, dir).status).toBe(0);
      expect(run([...both, '--max-warnings', '3'], dir).status).toBe(0);
      const atLimit = run([...both, '--max-warnings', '2'], dir);
      expect(atLimit.status).toBe(0);
      expect(atLimit.stderr).toBe('');
    });

    it('exits 1 when the warnings across all files exceed the limit', () => {
      const dir = warned();
      const over = run([...both, '--max-warnings', '1'], dir);
      expect(over.status).toBe(1);
      expect(over.stderr).toContain('Too many warnings: found 2, maximum allowed is 1');
      // The limit is a total, not per file.
      expect(run(['tokens/policy.json', '--max-warnings', '1'], dir).status).toBe(0);
    });

    it('treats 0 as no warnings allowed and accepts --max-warnings=n', () => {
      const dir = warned();
      expect(run(['tokens/policy.json', '--max-warnings', '0'], dir).status).toBe(1);
      expect(run(['tokens/policy.json', '--max-warnings=0'], dir).status).toBe(1);
      expect(run(['tokens/good.json', '--max-warnings', '0'], dir).status).toBe(0);
    });

    it('counts warnings reported by the validator as well as lint warnings', () => {
      const dir = project();
      // `color.hex.mismatch` is a validator warning; no lint rule is enabled here.
      writeFileSync(
        join(dir, 'tokens', 'hex-mismatch.json'),
        JSON.stringify({
          c: {
            $type: 'color',
            $value: { colorSpace: 'srgb', components: [1, 0, 0], hex: '#00ff00' },
          },
        }),
      );
      expect(run(['tokens/hex-mismatch.json'], dir).status).toBe(0);
      expect(run(['tokens/hex-mismatch.json', '--max-warnings', '1'], dir).status).toBe(0);
      const over = run(['tokens/hex-mismatch.json', '--max-warnings', '0'], dir);
      expect(over.status).toBe(1);
      expect(over.stderr).toContain('Too many warnings: found 1, maximum allowed is 0');
    });

    it('still exits 1 for errors when the warnings are within the limit', () => {
      const dir = warned();
      const r = run(['tokens/bad.json', '--max-warnings', '10'], dir);
      expect(r.status).toBe(1);
      expect(r.stdout).toContain('number.value.not-number');
      expect(r.stderr).not.toContain('Too many warnings');
    });

    it('rejects a value that is not a non-negative integer with exit 2', () => {
      const dir = warned();
      for (const value of ['abc', '1.5', '-1', '', '1e3', '99999999999999999999']) {
        const r = run(['tokens/good.json', `--max-warnings=${value}`], dir);
        expect(r.status, value).toBe(2);
        expect(r.stderr, value).toContain('Invalid --max-warnings value');
      }
    });
  });

  it('expands globs without following symlinks', () => {
    const dir = project();
    const outside = mkdtempSync(join(tmpdir(), 'outside-'));
    writeFileSync(join(outside, 'secret.json'), '{}');
    symlinkSync(outside, join(dir, 'tokens', 'link'), 'junction');
    const files = expandFiles(['tokens/**/*.json'], dir).map((f) =>
      f
        .slice(dir.length + 1)
        .split(sep)
        .join('/'),
    );
    expect(files).toEqual(['tokens/bad.json', 'tokens/good.json', 'tokens/policy.json']);
    expect(globToRegExp('**/*.tokens.json').test('a/b/c.tokens.json')).toBe(true);
    expect(globToRegExp('*.json').test('a/b.json')).toBe(false);
  });
});
