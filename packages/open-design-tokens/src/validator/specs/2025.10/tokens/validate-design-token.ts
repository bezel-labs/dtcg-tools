import type { ValidationIssue } from '../../../../core/issue.js';
import { hasOwn, isAliasOrReference } from '../../../../core/predicates.js';
import type { NodeInfo } from '../../../../core/prepare.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import { typeName } from '../../../primitives.js';
import { dereference } from '../aliases/dereference.js';
import type { Resolver } from '../aliases/resolver.js';
import { validateAliasToken } from '../aliases/validate-alias.js';
import { validateValueOfType } from '../composites/sub-value.js';
import { TOKEN_PROPS } from '../constants.js';
import type { TokenType } from '../types/token.js';
import {
  validateDeprecated,
  validateDescription,
  validateExtensions,
  validateType,
} from './validate-common-props.js';

export interface TokenValidation {
  issues: ValidationIssue[];
  /** `true` when the token's value is an alias or `$ref`. */
  isAlias: boolean;
}

/** Properties allowed on a reference node (`$ref` in place of `$value`). */
const REFERENCE_PROPS = ['$ref', '$type', '$description', '$extensions', '$deprecated'] as const;

/**
 * Validates one token (§5) or reference node (§7.1.2): its `$`-properties,
 * that it has no child members, that a type can be determined (own, inherited,
 * via `$extends`, or from the alias target), and that `$value` matches it.
 */
export function validateDesignToken(
  node: NodeInfo,
  resolver: Resolver,
  ctx: ValidationContext,
): TokenValidation {
  const issues: ValidationIssue[] = [];
  const token = node.raw;
  const isRefNode = node.kind === 'reference';
  const allowed: readonly string[] = isRefNode ? REFERENCE_PROPS : TOKEN_PROPS;

  validateDescription(token, 'token', ctx, issues);
  const ownType = validateType(token, 'token', ctx, issues);
  validateDeprecated(token, 'token', ctx, issues);
  validateExtensions(token, 'token', ctx, issues);

  for (const key of Object.keys(token)) {
    if (allowed.includes(key)) continue;
    if (key.startsWith('$')) {
      issues.push(createIssue(child(ctx, key), 'token.property.unknown', { property: key }));
    } else {
      issues.push(createIssue(child(ctx, key), 'token.property.not-allowed', { property: key }));
    }
  }

  const value = token.$value;
  const vctx = child(ctx, '$value');
  const isAlias = isRefNode || isAliasOrReference(value);
  const hasOwnType = hasOwn(token, '$type');

  // §5.2.2 / §6.7.3: own $type, else resolved through groups and $extends.
  let type: TokenType | undefined = hasOwnType ? ownType : resolver.effectiveType(node);
  if (hasOwnType && ownType === undefined) {
    // Invalid own $type already reported; nothing more to judge.
    return { issues, isAlias };
  }

  if (isAlias) {
    const check = validateAliasToken(node, type, resolver, isRefNode ? child(ctx, '$ref') : vctx);
    issues.push(...check.issues);
    if (!check.resolved) return { issues, isAlias };
    if (type === undefined) type = check.resolvedType;
    if (type === undefined) {
      issues.push(
        createIssue(ctx, 'token.type.missing', { via: 'alias', target: check.resolvedType }),
      );
      return { issues, isAlias };
    }
    // A $ref to a sub-value fragment carries a concrete value to check against this token's type.
    const fragment = fragmentValue(node, resolver);
    if (fragment.present) {
      const fctx = isRefNode ? child(ctx, '$ref') : vctx;
      const deref = dereference(fragment.value, fctx, resolver, node.pointer);
      issues.push(...deref.issues);
      if (!deref.failed) issues.push(...validateValueOfType(type, deref.value, fctx, resolver));
    }
    return { issues, isAlias };
  }

  if (type === undefined) {
    issues.push(createIssue(ctx, 'token.type.missing', { actualValueType: typeName(value) }));
    return { issues, isAlias };
  }

  // Property-level references (§7.3) are resolved first; then the value is
  // checked against its type, including composite sub-values and aliases.
  const deref = dereference(value, vctx, resolver, node.pointer);
  issues.push(...deref.issues);
  if (!deref.failed) issues.push(...validateValueOfType(type, deref.value, vctx, resolver));
  return { issues, isAlias };
}

/** When a token's `$ref` points below another token (a fragment), returns that raw fragment. */
function fragmentValue(node: NodeInfo, resolver: Resolver): { present: boolean; value?: unknown } {
  const ref =
    node.kind === 'reference'
      ? node.raw.$ref
      : hasOwn(node.raw, '$value') &&
          typeof node.raw.$value === 'object' &&
          node.raw.$value !== null &&
          hasOwn(node.raw.$value as object, '$ref')
        ? (node.raw.$value as { $ref: unknown }).$ref
        : undefined;
  if (typeof ref !== 'string') return { present: false };
  const res = resolver.resolveRef(ref, node.pointer);
  if (res.status !== 'ok') return { present: false };
  const whole = res.tokenNode && res.chain.length > 1;
  return whole ? { present: false } : { present: true, value: res.value };
}
