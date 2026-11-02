import type { ValidationIssue } from '../../../../core/issue.js';
import { hasOwn, isPlainObject, isToken } from '../../../../core/predicates.js';
import type { NodeInfo } from '../../../../core/prepare.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import { typeName } from '../../../primitives.js';
import { parseAlias } from '../aliases/parse.js';
import type { Resolver } from '../aliases/resolver.js';
import { GROUP_PROPS, ROOT_ONLY_PROPS, ROOT_TOKEN_NAME } from '../constants.js';
import {
  validateDeprecated,
  validateDescription,
  validateExtensions,
  validateType,
} from '../tokens/validate-common-props.js';
import { validateName } from '../tokens/validate-name.js';
import { validateExtends } from './validate-extends.js';
import { validateNameCollisions } from './validate-name-collisions.js';

/** `$extends` MUST be a group reference in alias syntax (§6.4); the target is resolved later. */
export function validateExtendsSyntax(
  group: Record<string, unknown>,
  ctx: ValidationContext,
  issues: ValidationIssue[],
): void {
  if (
    hasOwn(group, '$extends') &&
    (typeof group.$extends !== 'string' || !parseAlias(group.$extends))
  ) {
    issues.push(
      createIssue(child(ctx, '$extends'), 'group.extends.invalid', { actual: group.$extends }),
    );
  }
  if (hasOwn(group, '$ref')) {
    const ref = group.$ref;
    if (typeof ref !== 'string' || !ref.startsWith('#/')) {
      issues.push(createIssue(child(ctx, '$ref'), 'group.ref.invalid', { actual: ref }));
    }
  }
}

/**
 * Validates one group (§6): its `$`-properties, that every member is a token or
 * group with a legal name, the `$root` member, and case collisions between
 * sibling names.
 */
export function validateGroup(
  node: NodeInfo,
  resolver: Resolver,
  ctx: ValidationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const group = node.raw;
  const isRoot = node.path.length === 0;

  validateDescription(group, 'group', ctx, issues);
  validateType(group, 'group', ctx, issues);
  validateDeprecated(group, 'group', ctx, issues);
  validateExtensions(group, 'group', ctx, issues);
  validateExtendsSyntax(group, ctx, issues);
  issues.push(...validateExtends(node, resolver, ctx));

  const memberNames: string[] = [];
  for (const key of Object.keys(group)) {
    if (key.startsWith('$')) {
      if ((GROUP_PROPS as readonly string[]).includes(key)) continue;
      if (isRoot && (ROOT_ONLY_PROPS as readonly string[]).includes(key)) continue;
      if (key === ROOT_TOKEN_NAME) {
        if (!isToken(group[key])) {
          issues.push(createIssue(child(ctx, key), 'group.root.not-token'));
        }
        continue;
      }
      issues.push(createIssue(child(ctx, key), 'group.property.unknown', { property: key }));
      continue;
    }
    memberNames.push(key);
    const mctx = child(ctx, key);
    issues.push(...validateName(key, mctx));
    let member: unknown;
    try {
      member = group[key];
    } catch {
      continue; // a throwing getter was already reported by prepareDocument
    }
    if (!isPlainObject(member)) {
      issues.push(
        createIssue(mctx, 'group.member.invalid', { name: key, actualType: typeName(member) }),
      );
    }
  }

  issues.push(...validateNameCollisions(memberNames, ctx));
  return issues;
}
