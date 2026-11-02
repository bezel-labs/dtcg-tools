import type { LintConfig, LintRule } from './types.js';

/** Identity helper that gives config files type checking and completion. */
export function defineConfig(config: LintConfig): LintConfig {
  return config;
}

/** Identity helper for authoring rules with inferred option types. */
export function defineRule<Options>(rule: LintRule<Options>): LintRule<Options> {
  return rule;
}
