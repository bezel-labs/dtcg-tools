/**
 * Type-only entry point: `import type { DesignTokens } from 'open-design-tokens/types'`.
 */

export type { IssuePath, Severity, ValidationIssue } from './core/issue.js';
export type { NodeInfo, PreparedDocument, PrepareOptions } from './core/prepare.js';
export type { LinterOptions } from './linter/types.js';
export type { SpecId } from './validator/registry.js';
export type { ValidationResult, ValidationStats } from './validator/result.js';
export type {
  EmptyMeta,
  EnumMeta,
  IssueCode,
  IssueMeta,
  MessageCatalog,
  RangeMeta,
  ShapeMeta,
  SpecIssue,
} from './validator/specs/2025.10/messages.js';
export type * from './validator/specs/2025.10/types/index.js';
export type { ValidateOptions } from './validator/validate-dtcg.js';
