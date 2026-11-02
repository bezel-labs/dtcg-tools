export type { IssuePath, Severity, ValidationIssue } from '../core/issue.js';
export { fmt } from '../core/issue.js';
export { MAX_DEPTH } from '../core/limits.js';
export {
  escapePointerSegment,
  parseJsonPointer,
  toDotPath,
  toJsonPointer,
  unescapePointerSegment,
} from '../core/path.js';
export {
  hasOwn,
  isAlias,
  isAliasOrReference,
  isFiniteNumber,
  isGroup,
  isPlainObject,
  isReference,
  isToken,
} from '../core/predicates.js';
export type { ValidationContext } from './context.js';
export { child, createIssue, createRootContext } from './context.js';
export type { SpecId } from './registry.js';
export { LATEST_SPEC, SPEC_IDS } from './registry.js';
export type { ValidationResult, ValidationStats } from './result.js';
export * from './specs/2025.10/index.js';
export type { ValidateOptions } from './validate-dtcg.js';
export { validate, validateDtcg } from './validate-dtcg.js';
