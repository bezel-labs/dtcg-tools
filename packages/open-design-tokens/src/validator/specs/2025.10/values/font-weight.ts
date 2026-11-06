import type { ValidationIssue } from '../../../../core/issue.js';
import { hasOwn, isFiniteNumber } from '../../../../core/predicates.js';
import type { ValidationContext } from '../../../context.js';
import { createIssue } from '../../../context.js';
import { expectInRange, typeName } from '../../../primitives.js';
import { FONT_WEIGHT_ALIASES, FONT_WEIGHT_RANGE } from '../constants.js';
import type { EnumMeta } from '../messages.js';

const KEYWORDS = Object.keys(FONT_WEIGHT_ALIASES);

/**
 * Validates a `fontWeight` value (§8.4): a number in `[1, 1000]` or one of the
 * case-sensitive keyword aliases.
 */
export function validateFontWeightValue(value: unknown, ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (isFiniteNumber(value)) {
    expectInRange(value, FONT_WEIGHT_RANGE, ctx, 'font-weight.number.out-of-range', issues);
    return issues;
  }
  if (typeof value === 'string') {
    if (hasOwn(FONT_WEIGHT_ALIASES, value)) return issues;
    const meta: EnumMeta = { actual: value, allowed: KEYWORDS };
    const ci = KEYWORDS.find((k) => k.toLowerCase() === value.toLowerCase());
    if (ci) meta.suggestion = ci;
    issues.push(createIssue(ctx, 'font-weight.keyword.invalid', meta));
    return issues;
  }
  issues.push(
    createIssue(ctx, 'font-weight.value.invalid', {
      actualType: typeof value === 'number' ? 'non-finite number' : typeName(value),
    }),
  );
  return issues;
}
