import type { ValidationIssue } from '../../../../core/issue.js';
import { isFiniteNumber } from '../../../../core/predicates.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import { expectArray, expectInRange, typeName } from '../../../primitives.js';
import { CUBIC_BEZIER_X_RANGE } from '../constants.js';

/**
 * Validates a `cubicBezier` value (§8.6): `[P1x, P1y, P2x, P2y]`, four numbers
 * with both x coordinates in `[0, 1]`.
 */
export function validateCubicBezierValue(
  value: unknown,
  ctx: ValidationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!expectArray(value, ctx, 'cubic-bezier.value.not-array', issues)) return issues;
  if (value.length !== 4) {
    issues.push(createIssue(ctx, 'cubic-bezier.value.wrong-length', { actual: value.length }));
  }
  value.forEach((n, index) => {
    const ictx = child(ctx, String(index));
    if (!isFiniteNumber(n)) {
      issues.push(
        createIssue(ictx, 'cubic-bezier.point.not-number', { index, actualType: typeName(n) }),
      );
      return;
    }
    if (index % 2 === 0 && index < 4) {
      expectInRange(n, CUBIC_BEZIER_X_RANGE, ictx, 'cubic-bezier.x.out-of-range', issues, {
        index,
      });
    }
  });
  return issues;
}
