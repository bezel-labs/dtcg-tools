import type { ValidationIssue } from '../../../../core/issue.js';
import { isAlias, isFiniteNumber, isPlainObject } from '../../../../core/predicates.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import { typeName } from '../../../primitives.js';
import type { Resolver } from '../aliases/resolver.js';
import { SUB_FIELD_TYPES } from '../constants.js';
import { validateSubValue } from './sub-value.js';

const FIELDS = SUB_FIELD_TYPES.gradient;
const REQUIRED = ['color', 'position'] as const;

function validateStop(
  stop: Record<string, unknown>,
  ctx: ValidationContext,
  resolver: Resolver,
  issues: ValidationIssue[],
): void {
  for (const prop of REQUIRED) {
    if (!(prop in stop)) {
      issues.push(
        createIssue(ctx, 'composite.property.missing', {
          type: 'gradient',
          property: prop,
          expectedType: FIELDS[prop],
        }),
      );
    }
  }
  for (const key of Object.keys(stop)) {
    const kctx = child(ctx, key);
    const expected = FIELDS[key as keyof typeof FIELDS];
    if (expected === undefined) {
      issues.push(
        createIssue(kctx, 'value.unknown-property', { property: key, known: Object.keys(FIELDS) }),
      );
      continue;
    }
    issues.push(...validateSubValue(stop[key], expected, kctx, resolver));
    if (
      key === 'position' &&
      isFiniteNumber(stop.position) &&
      (stop.position < 0 || stop.position > 1)
    ) {
      issues.push(createIssue(kctx, 'gradient.position.out-of-range', { actual: stop.position }));
    }
  }
}

/** Validates a `gradient` value (§9.7): an array of stops and gradient aliases. */
export function validateGradientValue(
  value: unknown,
  ctx: ValidationContext,
  resolver: Resolver,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!Array.isArray(value)) {
    issues.push(createIssue(ctx, 'gradient.value.not-array', { actualType: typeName(value) }));
    return issues;
  }
  value.forEach((item, index) => {
    const ictx = child(ctx, String(index));
    if (typeof item === 'string' && isAlias(item)) {
      issues.push(...validateSubValue(item, 'gradient', ictx, resolver));
    } else if (isPlainObject(item)) {
      validateStop(item, ictx, resolver, issues);
    } else {
      issues.push(
        createIssue(ictx, 'gradient.stop.invalid', { index, actualType: typeName(item) }),
      );
    }
  });
  return issues;
}
