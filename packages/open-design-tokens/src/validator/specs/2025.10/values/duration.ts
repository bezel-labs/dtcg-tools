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
import { DURATION_UNITS } from '../constants.js';

const KNOWN_KEYS = ['value', 'unit'] as const;

/** Validates a `duration` value (§8.5): `{ value: number, unit: "ms" | "s" }`. */
export function validateDurationValue(value: unknown, ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!expectObject(value, ctx, 'duration.value.not-object', issues)) return issues;

  if (!hasOwn(value, 'value')) {
    issues.push(createIssue(ctx, 'duration.value.missing'));
  } else {
    expectFiniteNumber(value.value, child(ctx, 'value'), 'duration.value.not-number', issues);
  }

  if (!hasOwn(value, 'unit')) {
    issues.push(createIssue(ctx, 'duration.unit.missing'));
  } else {
    expectEnum(value.unit, DURATION_UNITS, child(ctx, 'unit'), 'duration.unit.invalid', issues);
  }

  warnUnknownKeys(value, KNOWN_KEYS, ctx, issues);
  return issues;
}
