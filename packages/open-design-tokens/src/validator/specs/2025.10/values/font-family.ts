import type { ValidationIssue } from '../../../../core/issue.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import { typeName } from '../../../primitives.js';

/** Validates a `fontFamily` value (§8.3): a string or an array of strings. */
export function validateFontFamilyValue(value: unknown, ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (typeof value === 'string') return issues;
  if (!Array.isArray(value)) {
    issues.push(createIssue(ctx, 'font-family.value.invalid', { actualType: typeName(value) }));
    return issues;
  }
  value.forEach((name, index) => {
    if (typeof name !== 'string') {
      issues.push(
        createIssue(child(ctx, String(index)), 'font-family.name.not-string', {
          index,
          actualType: typeName(name),
        }),
      );
    }
  });
  return issues;
}
