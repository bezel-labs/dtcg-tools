import type { ValidationIssue } from '../../../../core/issue.js';
import type { ValidationContext } from '../../../context.js';
import type { Resolver } from '../aliases/resolver.js';
import { SUB_FIELD_TYPES } from '../constants.js';
import { validateCompositeObject } from './sub-value.js';

const FIELDS = SUB_FIELD_TYPES.transition;
const REQUIRED = ['duration', 'delay', 'timingFunction'] as const;

/** Validates a `transition` value (§9.5): `{ duration, delay, timingFunction }`. */
export function validateTransitionValue(
  value: unknown,
  ctx: ValidationContext,
  resolver: Resolver,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  validateCompositeObject('transition', value, FIELDS, REQUIRED, ctx, resolver, issues);
  return issues;
}
