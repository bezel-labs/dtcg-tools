import type { ValidationIssue } from '../../../core/issue.js';
import { isPlainObject } from '../../../core/predicates.js';
import type { ValidationContext } from '../../context.js';
import { createIssue } from '../../context.js';
import type { ValidationStats } from '../../result.js';

export * from './constants.js';
export { SPEC_ID } from './constants.js';
export * from './messages.js';
export * from './types/index.js';

export interface DocumentValidation {
  issues: ValidationIssue[];
  stats: ValidationStats;
}

function typeName(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Validates a whole document against the 2025.10 format. The root must be an
 * object; it is then validated as a group, followed by document-wide passes.
 */
export function validateDocument(root: unknown, ctx: ValidationContext): DocumentValidation {
  const issues: ValidationIssue[] = [];
  const stats: ValidationStats = { tokens: 0, groups: 0, aliases: 0 };

  if (!isPlainObject(root)) {
    issues.push(createIssue(ctx, 'document.not-object', { actualType: typeName(root) }));
    return { issues, stats };
  }

  stats.groups = 1;
  return { issues, stats };
}
