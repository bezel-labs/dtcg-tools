import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { LintConfig } from '../types.js';

export const CONFIG_FILE_NAMES = [
  'dtcg-lint.config.json',
  'dtcg-lint.config.mjs',
  'dtcg-lint.config.js',
  'dtcg-lint.config.ts',
] as const;

export interface LoadedConfig {
  config: LintConfig;
  path: string | undefined;
}

/**
 * Loads a lint config. Only an explicit `--config` path or a config file in
 * `cwd` itself is considered: there is no parent-directory walk. JSON files are
 * parsed; `.js`/`.mjs`/`.ts` files are imported and therefore execute code,
 * the same trust model as an ESLint or Vite config.
 */
export async function loadConfig(cwd: string, explicitPath?: string): Promise<LoadedConfig> {
  const file = explicitPath
    ? isAbsolute(explicitPath)
      ? explicitPath
      : resolve(cwd, explicitPath)
    : findInCwd(cwd);
  if (!file) return { config: {}, path: undefined };
  if (!existsSync(file)) throw new Error(`Config file not found: ${file}`);
  if (file.endsWith('.json')) {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    if (typeof parsed !== 'object' || parsed === null)
      throw new Error(`Config file must contain an object: ${file}`);
    return { config: parsed as LintConfig, path: file };
  }
  const mod = (await import(pathToFileURL(file).href)) as { default?: LintConfig } & LintConfig;
  const config = mod.default ?? mod;
  if (typeof config !== 'object' || config === null)
    throw new Error(`Config file must export an object: ${file}`);
  return { config, path: file };
}

function findInCwd(cwd: string): string | undefined {
  for (const name of CONFIG_FILE_NAMES) {
    const p = resolve(cwd, name);
    if (existsSync(p)) return p;
  }
  return undefined;
}
