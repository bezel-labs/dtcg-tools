import type { ValidationIssue } from '../../../../core/issue.js';
import type { ValidationContext } from '../../../context.js';
import { createIssue } from '../../../context.js';

/**
 * Sibling names that differ only by case are valid but likely to collide once
 * a tool transforms them (§5.1, "Tools MAY display a warning"). One warning is
 * emitted per colliding set, at the group.
 */
export function validateNameCollisions(
  names: readonly string[],
  ctx: ValidationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const byLower = new Map<string, string[]>();
  for (const name of names) {
    const key = name.toLowerCase();
    const list = byLower.get(key);
    if (list) list.push(name);
    else byLower.set(key, [name]);
  }
  for (const group of byLower.values()) {
    if (group.length > 1) {
      issues.push(createIssue(ctx, 'group.name.case-collision', { names: group }));
    }
  }
  return issues;
}
