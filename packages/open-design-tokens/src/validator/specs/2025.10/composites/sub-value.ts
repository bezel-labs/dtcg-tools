import type { ValidationIssue } from '../../../../core/issue.js';
import { isAlias, isToken } from '../../../../core/predicates.js';
import type { NodeInfo } from '../../../../core/prepare.js';
import type { ValidationContext } from '../../../context.js';
import { createIssue } from '../../../context.js';
import { expectEnum, typeName } from '../../../primitives.js';
import { parseAlias } from '../aliases/parse.js';
import type { Resolver } from '../aliases/resolver.js';
import { COMPOSITE_TOKEN_TYPES, LINE_CAPS, PRIMITIVE_TOKEN_TYPES } from '../constants.js';
import type { CompositeTokenType, PrimitiveTokenType, TokenType } from '../types/token.js';
import { PRIMITIVE_VALUE_VALIDATORS } from '../values/index.js';
import { validateBorderValue } from './border.js';
import { validateGradientValue } from './gradient.js';
import { validateShadowValue } from './shadow.js';
import { validateStrokeStyleValue } from './stroke-style.js';
import { validateTransitionValue } from './transition.js';
import { validateTypographyValue } from './typography.js';

/** Sub-value types: every token type plus the `lineCap` keyword set. */
export type SubValueType = TokenType | 'lineCap';

export type CompositeValidator = (
  value: unknown,
  ctx: ValidationContext,
  resolver: Resolver,
) => ValidationIssue[];

export const COMPOSITE_VALUE_VALIDATORS: Record<CompositeTokenType, CompositeValidator> = {
  strokeStyle: validateStrokeStyleValue,
  border: validateBorderValue,
  transition: validateTransitionValue,
  shadow: validateShadowValue,
  gradient: validateGradientValue,
  typography: validateTypographyValue,
};

function isPrimitive(t: SubValueType): t is PrimitiveTokenType {
  return (PRIMITIVE_TOKEN_TYPES as readonly string[]).includes(t);
}
function isComposite(t: SubValueType): t is CompositeTokenType {
  return (COMPOSITE_TOKEN_TYPES as readonly string[]).includes(t);
}

/** Validates a concrete (non-alias) value against a token type. */
export function validateValueOfType(
  type: SubValueType,
  value: unknown,
  ctx: ValidationContext,
  resolver: Resolver,
): ValidationIssue[] {
  if (isPrimitive(type)) return PRIMITIVE_VALUE_VALIDATORS[type](value, ctx);
  if (isComposite(type)) return COMPOSITE_VALUE_VALIDATORS[type](value, ctx, resolver);
  const issues: ValidationIssue[] = [];
  expectEnum(value, LINE_CAPS, ctx, 'stroke-style.line-cap.invalid', issues);
  return issues;
}

/**
 * Validates a sub-value of a composite (§9): either an explicit value of the
 * expected type or a `{curly}` alias to a token whose resolved type matches.
 * Nested `$ref` fragments have already been dereferenced.
 */
export function validateSubValue(
  value: unknown,
  expectedType: SubValueType,
  ctx: ValidationContext,
  resolver: Resolver,
): ValidationIssue[] {
  if (typeof value === 'string' && isAlias(value)) {
    return validateAliasSubValue(value, expectedType, ctx, resolver);
  }
  return validateValueOfType(expectedType, value, ctx, resolver);
}

function validateAliasSubValue(
  alias: string,
  expectedType: SubValueType,
  ctx: ValidationContext,
  resolver: Resolver,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const segments = parseAlias(alias);
  if (!segments) {
    issues.push(createIssue(ctx, 'alias.syntax.invalid', { actual: alias }));
    return issues;
  }
  const found = resolver.lookupPath(segments);
  const path = segments.join('.');
  if (!found) {
    issues.push(createIssue(ctx, 'alias.target.missing', { alias, path }));
    return issues;
  }
  if (!isToken(found.value)) {
    issues.push(createIssue(ctx, 'alias.target.not-token', { alias, path }));
    return issues;
  }
  const node: NodeInfo | undefined = found.node ?? resolver.node(found.originPointer);
  if (!node) {
    issues.push(createIssue(ctx, 'alias.target.missing', { alias, path }));
    return issues;
  }
  const res = resolver.resolveAlias(node.pointer);
  if (res.status === 'cycle') {
    issues.push(createIssue(ctx, 'alias.cycle', { chain: res.chain }));
    return issues;
  }
  if (res.status !== 'ok' || !res.target) {
    issues.push(createIssue(ctx, 'alias.target.missing', { alias, path: res.path }));
    return issues;
  }
  const actual = resolver.effectiveType(res.target);
  if (actual !== undefined && actual !== expectedType) {
    issues.push(
      createIssue(ctx, 'alias.type.mismatch', {
        alias,
        actual,
        expected: expectedType,
        target: res.target.pointer,
      }),
    );
  }
  return issues;
}

/** Shared check for object-shaped composites: object, required properties, sub-values, unknown keys. */
export function validateCompositeObject(
  type: CompositeTokenType,
  value: unknown,
  fields: Readonly<Record<string, SubValueType>>,
  required: readonly string[],
  ctx: ValidationContext,
  resolver: Resolver,
  issues: ValidationIssue[],
): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    issues.push(
      createIssue(ctx, 'composite.value.not-object', {
        type,
        properties: Object.keys(fields),
        actualType: typeName(value),
      }),
    );
    return false;
  }
  const obj = value as Record<string, unknown>;
  for (const prop of required) {
    if (!(prop in obj)) {
      issues.push(
        createIssue(ctx, 'composite.property.missing', {
          type,
          property: prop,
          expectedType: fields[prop],
        }),
      );
    }
  }
  for (const key of Object.keys(obj)) {
    const expected = fields[key];
    const kctx = { spec: ctx.spec, path: [...ctx.path, key] };
    if (expected === undefined) {
      issues.push(
        createIssue(kctx, 'value.unknown-property', { property: key, known: Object.keys(fields) }),
      );
      continue;
    }
    issues.push(...validateSubValue(obj[key], expected, kctx, resolver));
  }
  return true;
}
