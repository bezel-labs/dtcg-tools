import type { ValidationIssue } from '../../../../core/issue.js';
import { isAlias, isPlainObject } from '../../../../core/predicates.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import { typeName } from '../../../primitives.js';
import type { Resolver } from '../aliases/resolver.js';
import { SUB_FIELD_TYPES } from '../constants.js';
import { validateSubValue } from './sub-value.js';

const FIELDS = SUB_FIELD_TYPES.shadow;
const REQUIRED = ['color', 'offsetX', 'offsetY', 'blur', 'spread'] as const;
const KNOWN = [...Object.keys(FIELDS), 'inset'];

function validateShadowObject(
  obj: Record<string, unknown>,
  ctx: ValidationContext,
  resolver: Resolver,
  issues: ValidationIssue[],
): void {
  for (const prop of REQUIRED) {
    if (!(prop in obj)) {
      issues.push(
        createIssue(ctx, 'composite.property.missing', {
          type: 'shadow',
          property: prop,
          expectedType: FIELDS[prop],
        }),
      );
    }
  }
  for (const key of Object.keys(obj)) {
    const kctx = child(ctx, key);
    if (key === 'inset') {
      if (typeof obj.inset !== 'boolean') {
        issues.push(
          createIssue(kctx, 'shadow.inset.not-boolean', { actualType: typeName(obj.inset) }),
        );
      }
      continue;
    }
    const expected = FIELDS[key as keyof typeof FIELDS];
    if (expected === undefined) {
      issues.push(createIssue(kctx, 'value.unknown-property', { property: key, known: KNOWN }));
      continue;
    }
    issues.push(...validateSubValue(obj[key], expected, kctx, resolver));
  }
}

/** Validates a `shadow` value (§9.6): one shadow object, or an array of objects and shadow aliases. */
export function validateShadowValue(
  value: unknown,
  ctx: ValidationContext,
  resolver: Resolver,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const ictx = child(ctx, String(index));
      if (typeof item === 'string' && isAlias(item)) {
        issues.push(...validateSubValue(item, 'shadow', ictx, resolver));
      } else if (isPlainObject(item)) {
        validateShadowObject(item, ictx, resolver, issues);
      } else {
        issues.push(
          createIssue(ictx, 'shadow.item.invalid', { index, actualType: typeName(item) }),
        );
      }
    });
    return issues;
  }
  if (isPlainObject(value)) {
    validateShadowObject(value, ctx, resolver, issues);
    return issues;
  }
  issues.push(createIssue(ctx, 'shadow.value.invalid', { actualType: typeName(value) }));
  return issues;
}
