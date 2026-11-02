import type { ValidationIssue } from '../../../../core/issue.js';
import type { ValidationContext } from '../../../context.js';
import { createIssue } from '../../../context.js';
import { FORBIDDEN_NAME_CHARS } from '../constants.js';

/**
 * Validates a token or group name (§5.1.1). Names starting with `$` never reach
 * here: they are treated as properties by the group validator. `ctx` points at
 * the named node.
 */
export function validateName(name: string, ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (name === '') {
    issues.push(createIssue(ctx, 'name.empty'));
    return issues;
  }
  for (const character of FORBIDDEN_NAME_CHARS) {
    if (name.includes(character)) {
      issues.push(createIssue(ctx, 'name.forbidden-character', { name, character }));
    }
  }
  return issues;
}
