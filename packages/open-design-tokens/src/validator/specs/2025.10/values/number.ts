import type { ValidationIssue } from '../../../../core/issue.js';
import type { ValidationContext } from '../../../context.js';
import { expectFiniteNumber } from '../../../primitives.js';

/** Validates a `number` value (§8.7): any JSON number. */
export function validateNumberValue(value: unknown, ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  expectFiniteNumber(value, ctx, 'number.value.not-number', issues);
  return issues;
}
