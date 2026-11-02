import type { ValidationIssue } from '../../../../core/issue.js';
import { hasOwn } from '../../../../core/predicates.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import {
  expectEnum,
  expectFiniteNumber,
  expectObject,
  warnUnknownKeys,
} from '../../../primitives.js';
import { DIMENSION_UNITS } from '../constants.js';

const KNOWN_KEYS = ['value', 'unit'] as const;

/** Validates a `dimension` value (§8.2): `{ value: number, unit: "px" | "rem" }`. */
export function validateDimensionValue(value: unknown, ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!expectObject(value, ctx, 'dimension.value.not-object', issues)) return issues;

  if (!hasOwn(value, 'value')) {
    issues.push(createIssue(ctx, 'dimension.value.missing'));
  } else {
    expectFiniteNumber(value.value, child(ctx, 'value'), 'dimension.value.not-number', issues);
  }

  if (!hasOwn(value, 'unit')) {
    issues.push(createIssue(ctx, 'dimension.unit.missing'));
  } else {
    expectEnum(value.unit, DIMENSION_UNITS, child(ctx, 'unit'), 'dimension.unit.invalid', issues);
  }

  warnUnknownKeys(value, KNOWN_KEYS, ctx, issues);
  return issues;
}
