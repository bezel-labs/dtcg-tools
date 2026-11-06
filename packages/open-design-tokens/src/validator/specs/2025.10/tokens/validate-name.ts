import type { ValidationIssue } from '../../../../core/issue.js';
import type { ValidationContext } from '../../../context.js';
import { createIssue } from '../../../context.js';
import { FORBIDDEN_NAME_CHARS } from '../constants.js';

/**
 * Validates a token or group name (§5.1.1). Names starting with `$` never reach
 * here: they are treated as properties by the group validator. `ctx` points at
 * the named node. A name is reported once, with every forbidden character it
 * contains, so a client shows one problem per name.
 */
export function validateName(name: string, ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (name === '') {
    issues.push(createIssue(ctx, 'name.empty'));
    return issues;
  }
  const characters = FORBIDDEN_NAME_CHARS.filter((character) => name.includes(character));
  const [first] = characters;
  if (first !== undefined) {
    issues.push(
      createIssue(ctx, 'name.forbidden-character', { name, character: first, characters }),
    );
  }
  return issues;
}
