/**
 * Linter entry point: `import { lintDtcg, defineConfig } from 'open-design-tokens/linter'`.
 * Browser-safe; takes a config object. File-based config loading lives in
 * `./node/load-config` and is used by the CLI only.
 */
export { resolveConfig } from './config.js';
export { defineConfig, defineRule } from './define.js';
export { lintDtcg } from './engine.js';
export type { FormatName, FormatOptions } from './formatters/index.js';
export { formatGithub, formatJson, formatPretty } from './formatters/index.js';
export { PRESETS, recommended } from './presets/index.js';
export type {
  AliasDepthOptions,
  AllowedVendorsOptions,
  ExtensionsSchemaOptions,
  FieldSchema,
  FieldSpec,
  LengthOptions,
  NamingOptions,
  NamingStyle,
  UnusedTokensOptions,
  VendorCheck,
} from './rules/index.js';
export { rules } from './rules/index.js';
export type {
  LintConfig,
  LintContext,
  LintIssue,
  LintOptions,
  LintResult,
  LintRule,
  PresetName,
  ReferenceGraph,
  ResolvedConfig,
  ResolvedRule,
  RuleMeta,
  RuleReport,
  RuleSetting,
  RuleSeverity,
  RuleVisitor,
  SkippedCheck,
} from './types.js';
