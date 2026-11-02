import type { ValidationIssue } from '../../../../core/issue.js';
import { hasOwn, isPlainObject } from '../../../../core/predicates.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import { expectEnum, typeName } from '../../../primitives.js';
import { TOKEN_TYPES } from '../constants.js';
import type { IssueCode } from '../messages.js';
import type { TokenType } from '../types/token.js';

type Owner = 'token' | 'group';

/** `$description` MUST be a plain JSON string (§5.2.1, §6.3). */
export function validateDescription(
  node: Record<string, unknown>,
  owner: Owner,
  ctx: ValidationContext,
  issues: ValidationIssue[],
): void {
  if (!hasOwn(node, '$description')) return;
  if (typeof node.$description !== 'string') {
    issues.push(
      createIssue(child(ctx, '$description'), `${owner}.description.not-string` as IssueCode, {
        actualType: typeName(node.$description),
      }),
    );
  }
}

/** `$type` MUST be a case-sensitive string from the type list (§5.2.2). Returns the type when valid. */
export function validateType(
  node: Record<string, unknown>,
  owner: Owner,
  ctx: ValidationContext,
  issues: ValidationIssue[],
): TokenType | undefined {
  if (!hasOwn(node, '$type')) return undefined;
  const tctx = child(ctx, '$type');
  if (typeof node.$type !== 'string') {
    issues.push(
      createIssue(tctx, `${owner}.type.not-string` as IssueCode, {
        actualType: typeName(node.$type),
      }),
    );
    return undefined;
  }
  return expectEnum(node.$type, TOKEN_TYPES, tctx, `${owner}.type.invalid` as IssueCode, issues)
    ? (node.$type as TokenType)
    : undefined;
}

/** `$deprecated` MUST be `true`, `false`, or a string (§5.2.4, §6.3.1). */
export function validateDeprecated(
  node: Record<string, unknown>,
  owner: Owner,
  ctx: ValidationContext,
  issues: ValidationIssue[],
): void {
  if (!hasOwn(node, '$deprecated')) return;
  const v = node.$deprecated;
  if (typeof v !== 'boolean' && typeof v !== 'string') {
    issues.push(
      createIssue(child(ctx, '$deprecated'), `${owner}.deprecated.invalid` as IssueCode, {
        actualType: typeName(v),
      }),
    );
  }
}

/**
 * `$extensions` MUST be an object keyed by vendor (§5.2.3, §6.3.2). Keys SHOULD
 * use reverse domain notation, so a key without a dot is a warning. Values are
 * any JSON and are not inspected by the validator.
 */
export function validateExtensions(
  node: Record<string, unknown>,
  owner: Owner,
  ctx: ValidationContext,
  issues: ValidationIssue[],
): void {
  if (!hasOwn(node, '$extensions')) return;
  const ectx = child(ctx, '$extensions');
  const ext = node.$extensions;
  if (!isPlainObject(ext)) {
    issues.push(
      createIssue(ectx, `${owner}.extensions.not-object` as IssueCode, {
        actualType: typeName(ext),
      }),
    );
    return;
  }
  for (const key of Object.keys(ext)) {
    if (!key.includes('.')) {
      issues.push(
        createIssue(child(ectx, key), `${owner}.extensions.key-not-namespaced` as IssueCode, {
          key,
        }),
      );
    }
  }
}
