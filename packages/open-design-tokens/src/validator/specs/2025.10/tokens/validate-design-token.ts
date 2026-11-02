import type { ValidationIssue } from '../../../../core/issue.js';
import { hasOwn, isAliasOrReference } from '../../../../core/predicates.js';
import type { NodeInfo } from '../../../../core/prepare.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import { typeName } from '../../../primitives.js';
import { PRIMITIVE_TOKEN_TYPES, TOKEN_PROPS, TOKEN_TYPES } from '../constants.js';
import type { PrimitiveTokenType } from '../types/token.js';
import { PRIMITIVE_VALUE_VALIDATORS } from '../values/index.js';
import {
  validateDeprecated,
  validateDescription,
  validateExtensions,
  validateType,
} from './validate-common-props.js';

export interface TokenValidation {
  issues: ValidationIssue[];
  /** `true` when `$value` is an alias or `$ref` (resolved in a later pass). */
  isAlias: boolean;
}

function isKnownType(type: unknown): type is (typeof TOKEN_TYPES)[number] {
  return typeof type === 'string' && (TOKEN_TYPES as readonly string[]).includes(type);
}

function isPrimitiveType(type: string): type is PrimitiveTokenType {
  return (PRIMITIVE_TOKEN_TYPES as readonly string[]).includes(type);
}

/**
 * Validates one token (§5): its `$`-properties, that it has no child members,
 * that a type can be determined, and that `$value` matches that type. Alias
 * values are counted and left for the alias pass.
 */
export function validateDesignToken(node: NodeInfo, ctx: ValidationContext): TokenValidation {
  const issues: ValidationIssue[] = [];
  const token = node.raw;

  validateDescription(token, 'token', ctx, issues);
  const ownType = validateType(token, 'token', ctx, issues);
  validateDeprecated(token, 'token', ctx, issues);
  validateExtensions(token, 'token', ctx, issues);

  for (const key of Object.keys(token)) {
    if ((TOKEN_PROPS as readonly string[]).includes(key)) continue;
    if (key.startsWith('$')) {
      issues.push(createIssue(child(ctx, key), 'token.property.unknown', { property: key }));
    } else {
      issues.push(createIssue(child(ctx, key), 'token.property.not-allowed', { property: key }));
    }
  }

  const value = token.$value;
  const vctx = child(ctx, '$value');
  const isAlias = isAliasOrReference(value);

  // Type resolution (§5.2.2): own $type, else inherited; aliases resolve later.
  const hasOwnType = hasOwn(token, '$type');
  const type = hasOwnType
    ? ownType
    : isKnownType(node.inheritedType)
      ? node.inheritedType
      : undefined;

  if (type === undefined) {
    // A type may still arrive via $extends (resolved in a later pass) or via the alias target.
    if (!hasOwnType && !isAlias && !node.underExtends) {
      issues.push(createIssue(ctx, 'token.type.missing', { actualValueType: typeName(value) }));
    }
    return { issues, isAlias };
  }

  if (isAlias) return { issues, isAlias };

  if (isPrimitiveType(type)) {
    issues.push(...PRIMITIVE_VALUE_VALIDATORS[type](value, vctx));
  }
  // Composite types are validated in a later milestone.
  return { issues, isAlias };
}
