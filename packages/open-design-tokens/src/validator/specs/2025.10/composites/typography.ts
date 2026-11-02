import type { ValidationIssue } from '../../../../core/issue.js';
import type { ValidationContext } from '../../../context.js';
import type { Resolver } from '../aliases/resolver.js';
import { SUB_FIELD_TYPES } from '../constants.js';
import { validateCompositeObject } from './sub-value.js';

const FIELDS = SUB_FIELD_TYPES.typography;
const REQUIRED = ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'lineHeight'] as const;

/** Validates a `typography` value (§9.8): five required sub-values. */
export function validateTypographyValue(
  value: unknown,
  ctx: ValidationContext,
  resolver: Resolver,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  validateCompositeObject('typography', value, FIELDS, REQUIRED, ctx, resolver, issues);
  return issues;
}
