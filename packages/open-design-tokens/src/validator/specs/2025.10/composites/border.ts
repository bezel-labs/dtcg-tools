import type { ValidationIssue } from '../../../../core/issue.js';
import type { ValidationContext } from '../../../context.js';
import type { Resolver } from '../aliases/resolver.js';
import { SUB_FIELD_TYPES } from '../constants.js';
import { validateCompositeObject } from './sub-value.js';

const FIELDS = SUB_FIELD_TYPES.border;
const REQUIRED = ['color', 'width', 'style'] as const;

/** Validates a `border` value (§9.4): `{ color, width, style }`. */
export function validateBorderValue(
  value: unknown,
  ctx: ValidationContext,
  resolver: Resolver,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  validateCompositeObject('border', value, FIELDS, REQUIRED, ctx, resolver, issues);
  return issues;
}
