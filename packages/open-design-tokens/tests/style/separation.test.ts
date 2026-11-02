import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.ts')) out.push(p);
  }
  return out;
}
const SRC = fileURLToPath(new URL('../../src', import.meta.url));

/**
 * The validator checks the specification and nothing else. It must not depend
 * on the linter, and it must not grow configurable limits or policy options.
 */
describe('validator / linter separation', () => {
  const validatorFiles = [...walk(join(SRC, 'validator')), ...walk(join(SRC, 'core'))];

  it('validator and core never import from linter', () => {
    const offenders = validatorFiles.filter((f) =>
      /from\s+['"][^'"]*\/linter[/'"]/.test(readFileSync(f, 'utf8')),
    );
    expect(offenders.map((f) => relative(SRC, f))).toEqual([]);
  });

  it('validator has no lint configuration or policy options', () => {
    const banned =
      /\b(LintConfig|LintRule|LintOptions|lintOptions|ruleOptions|maxLength|minLength|namingConvention)\b/;
    const offenders = validatorFiles.filter((f) => banned.test(readFileSync(f, 'utf8')));
    expect(offenders.map((f) => relative(SRC, f))).toEqual([]);
  });

  it('node builtins appear only in cli.ts and linter/node', () => {
    const offenders = walk(SRC).filter((f) => {
      const rel = relative(SRC, f);
      if (rel === 'cli.ts' || rel.startsWith(join('linter', 'node'))) return false;
      return /from\s+['"]node:/.test(readFileSync(f, 'utf8'));
    });
    expect(offenders.map((f) => relative(SRC, f))).toEqual([]);
  });
});
