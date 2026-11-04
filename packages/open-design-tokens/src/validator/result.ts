import type { ValidationIssue } from '../core/issue.js';
import type { SpecId } from './registry.js';
import type { SpecIssue } from './specs/2025.10/messages.js';

export interface ValidationStats {
  tokens: number;
  groups: number;
  aliases: number;
}

export interface ValidationResult {
  /** `true` when no issue has severity `error`. */
  valid: boolean;
  /** Every issue, with `meta` typed by `code`: narrow on `code` to read the details. */
  issues: SpecIssue[];
  errors: SpecIssue[];
  warnings: SpecIssue[];
  spec: SpecId;
  stats: ValidationStats;
}

export function toResult(
  spec: SpecId,
  issues: ValidationIssue[],
  stats: ValidationStats,
): ValidationResult {
  // Every validator issue is built by `createIssue`, which types `meta` by `code`.
  const typed = issues as SpecIssue[];
  const errors = typed.filter((i) => i.severity === 'error');
  const warnings = typed.filter((i) => i.severity === 'warning');
  return { valid: errors.length === 0, issues: typed, errors, warnings, spec, stats };
}
