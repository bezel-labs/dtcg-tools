import type { ValidationIssue } from '../core/issue.js';
import type { SpecId } from './registry.js';

export interface ValidationStats {
  tokens: number;
  groups: number;
  aliases: number;
}

export interface ValidationResult {
  /** `true` when no issue has severity `error`. */
  valid: boolean;
  issues: ValidationIssue[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  spec: SpecId;
  stats: ValidationStats;
}

export function toResult(
  spec: SpecId,
  issues: ValidationIssue[],
  stats: ValidationStats,
): ValidationResult {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  return { valid: errors.length === 0, issues, errors, warnings, spec, stats };
}
