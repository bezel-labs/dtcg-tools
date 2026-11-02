import type { Severity } from '../core/issue.js';
import { isPlainObject } from '../core/predicates.js';
import { PRESETS } from './presets/index.js';
import { BUILTIN_RULES } from './rules/index.js';
import type {
  LintConfig,
  LintOptions,
  LintRule,
  ResolvedConfig,
  ResolvedRule,
  RuleSetting,
  RuleSeverity,
} from './types.js';

function parseSetting(setting: RuleSetting): { severity: RuleSeverity; options: unknown } {
  if (Array.isArray(setting)) {
    const [severity, options] = setting as readonly [RuleSeverity, unknown];
    return { severity, options };
  }
  return { severity: setting as RuleSeverity, options: undefined };
}

function isSeverity(s: unknown): s is RuleSeverity {
  return s === 'error' || s === 'warning' || s === 'off';
}

/**
 * Resolves a config object into the list of rules to run. Pure: it never
 * reads the file system. Unknown rule ids, bad severities, and malformed rule
 * options are programmer errors and throw.
 */
export function resolveConfig(
  config: LintConfig = {},
  opts: Pick<LintOptions, 'rules'> = {},
): ResolvedConfig {
  const registry = new Map<string, LintRule>();
  for (const r of BUILTIN_RULES) registry.set(r.id, r);
  for (const r of opts.rules ?? []) registry.set(r.id, r);

  // Start with presets (in order), then apply explicit rules.
  const settings = new Map<string, RuleSetting>();
  for (const name of config.extends ?? []) {
    const preset = PRESETS[name];
    if (!preset) throw new RangeError(`Unknown lint preset: ${String(name)}`);
    for (const [id, s] of Object.entries(preset.rules ?? {})) settings.set(id, s);
  }
  for (const [id, s] of Object.entries(config.rules ?? {})) settings.set(id, s);

  const resolved: ResolvedRule[] = [];
  for (const [id, setting] of settings) {
    const rule = registry.get(id);
    if (!rule) throw new RangeError(`Unknown lint rule: ${id}`);
    const { severity, options } = parseSetting(setting);
    if (!isSeverity(severity))
      throw new RangeError(`Rule ${id}: severity must be "error", "warning", or "off"`);
    if (severity === 'off') continue;
    const merged = mergeOptions(rule.meta.defaultOptions, options);
    const problem = rule.meta.validateOptions?.(merged);
    if (problem) throw new RangeError(`Rule ${id}: ${problem}`);
    resolved.push({ rule, severity: severity as Severity, options: merged });
  }
  return { rules: resolved };
}

function mergeOptions(defaults: unknown, user: unknown): unknown {
  if (user === undefined) return defaults;
  if (isPlainObject(defaults) && isPlainObject(user)) return { ...defaults, ...user };
  return user;
}
