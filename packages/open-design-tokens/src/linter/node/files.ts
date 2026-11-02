import { lstatSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

/** Converts a glob (`*`, `**`, `?`) to an anchored regular expression over `/`-separated paths. */
export function globToRegExp(glob: string): RegExp {
  let re = '';
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i] as string;
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i += 1;
        if (glob[i + 1] === '/') i += 1;
        re += '(?:.*/)?';
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

const hasGlob = (s: string): boolean => /[*?]/.test(s);

/**
 * Expands file arguments. Plain paths are returned as given; globs are matched
 * against files under `cwd`. Symbolic links are never followed, so a glob
 * cannot escape the working directory.
 */
export function expandFiles(args: readonly string[], cwd: string): string[] {
  const out = new Set<string>();
  for (const arg of args) {
    if (!hasGlob(arg)) {
      out.add(resolve(cwd, arg));
      continue;
    }
    const pattern = globToRegExp(arg.replace(/\\/g, '/').replace(/^\.\//, ''));
    walk(cwd, cwd, pattern, out);
  }
  return [...out].sort();
}

function walk(root: string, dir: string, pattern: RegExp, out: Set<string>): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    let stat: ReturnType<typeof lstatSync>;
    try {
      stat = lstatSync(full);
    } catch {
      continue;
    }
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) walk(root, full, pattern, out);
    else if (pattern.test(relative(root, full).split(sep).join('/'))) out.add(full);
  }
}
