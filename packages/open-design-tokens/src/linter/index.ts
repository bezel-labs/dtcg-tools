/**
 * Linter entry point: `import { lint, defineConfig } from 'open-design-tokens/linter'`.
 * Browser-safe; takes a config object. File-based config loading lives in
 * `./node/load-config` and is used by the CLI only.
 */

export type { ResolveOptions } from './config.js';
export { resolveConfig } from './config.js';
export { defineConfig, defineRule } from './define.js';
export type { LintOptions } from './engine.js';
export { buildReferenceGraph, lint } from './engine.js';
export * as examples from './examples/com.example.app.js';
export type { FormatName, FormatOptions } from './formatters/index.js';
export { formatGithub, formatJson, formatPretty } from './formatters/index.js';
export { PRESETS, recommended } from './presets/index.js';
export type * from './rules/index.js';
export { BUILTIN_RULES, rules } from './rules/index.js';
export type * from './types.js';
