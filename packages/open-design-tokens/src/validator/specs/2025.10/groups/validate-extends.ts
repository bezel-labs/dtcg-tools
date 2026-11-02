import type { ValidationIssue } from '../../../../core/issue.js';
import { hasOwn, isPlainObject, isToken } from '../../../../core/predicates.js';
import type { NodeInfo } from '../../../../core/prepare.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import type { Resolver } from '../aliases/resolver.js';
import { PRIMITIVE_TOKEN_TYPES, TOKEN_TYPES } from '../constants.js';
import type { PrimitiveTokenType, TokenType } from '../types/token.js';
import { PRIMITIVE_VALUE_VALIDATORS } from '../values/index.js';

/**
 * Resolves a group's `$extends`/`$ref` target (§6.4): it must exist, be a
 * group, and not create a cycle. Then re-checks inherited tokens whose
 * effective type changes in this group (§6.7.3), reporting at the group.
 */
export function validateExtends(
  node: NodeInfo,
  resolver: Resolver,
  ctx: ValidationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const raw = node.raw;
  const prop = hasOwn(raw, '$extends') ? '$extends' : hasOwn(raw, '$ref') ? '$ref' : undefined;
  if (!prop) return issues;
  const pctx = child(ctx, prop);
  const target = resolver.extendsTarget(raw);
  if (!target) return issues;

  switch (target.status) {
    case 'malformed':
    case 'not-local':
      return issues; // syntax already reported by validateExtendsSyntax
    case 'missing':
      issues.push(
        createIssue(pctx, 'extends.target.missing', {
          actual: target.actual,
          path: target.pointer,
        }),
      );
      return issues;
    case 'not-group':
      issues.push(
        createIssue(pctx, 'extends.target.not-group', {
          actual: target.actual,
          path: target.pointer,
        }),
      );
      return issues;
    default:
      break;
  }

  const view = resolver.mergedGroup(node.pointer, raw);
  if (view.extendsStatus === 'cycle') {
    issues.push(createIssue(pctx, 'extends.cycle', { chain: [node.pointer, target.pointer] }));
    return issues;
  }

  // Inherited tokens: only those not overridden locally, whose type in this
  // group differs from their type at the origin.
  const groupType = resolver.effectiveType(node);
  for (const [name, member] of view.members) {
    if (hasOwn(raw, name)) continue;
    if (!isPlainObject(member.value) || !isToken(member.value)) continue;
    const origin = resolver.node(member.originPointer);
    const originType = origin ? resolver.effectiveType(origin) : undefined;
    const ownType = typeof member.value.$type === 'string' ? member.value.$type : undefined;
    const hereType: TokenType | undefined = isKnown(ownType) ? ownType : groupType;
    if (hereType === originType) continue;
    const reason = describeInheritedProblem(member.value, hereType);
    if (reason) {
      issues.push(
        createIssue(child(ctx, name), 'extends.inherited-token.invalid', {
          token: name,
          inheritedFrom: member.originPointer,
          effectiveType: hereType,
          originType,
          reason,
        }),
      );
    }
  }
  return issues;
}

function isKnown(t: unknown): t is TokenType {
  return typeof t === 'string' && (TOKEN_TYPES as readonly string[]).includes(t);
}

function describeInheritedProblem(
  token: Record<string, unknown>,
  type: TokenType | undefined,
): string | undefined {
  if (type === undefined) return 'no $type can be determined for it here';
  const value = token.$value;
  if (typeof value === 'string' && value.startsWith('{')) return undefined; // alias: judged at its origin
  if (isPlainObject(value) && hasOwn(value, '$ref')) return undefined;
  if ((PRIMITIVE_TOKEN_TYPES as readonly string[]).includes(type)) {
    const sub = PRIMITIVE_VALUE_VALIDATORS[type as PrimitiveTokenType](value, {
      spec: '2025.10',
      path: [],
    });
    const first = sub.find((i) => i.severity === 'error');
    if (first) return `as ${type}, ${first.message}`;
  }
  return undefined;
}
