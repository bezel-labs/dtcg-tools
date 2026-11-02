import type { ValidationIssue } from '../../../../core/issue.js';
import { isPlainObject } from '../../../../core/predicates.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import { expectEnum, typeName } from '../../../primitives.js';
import type { Resolver } from '../aliases/resolver.js';
import { STROKE_STYLES, SUB_FIELD_TYPES } from '../constants.js';
import { validateSubValue } from './sub-value.js';

const FIELDS = SUB_FIELD_TYPES.strokeStyle;

/** Validates a `strokeStyle` value (§9.3): a keyword, or `{ dashArray, lineCap }`. */
export function validateStrokeStyleValue(
  value: unknown,
  ctx: ValidationContext,
  resolver: Resolver,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (typeof value === 'string') {
    expectEnum(value, STROKE_STYLES, ctx, 'stroke-style.keyword.invalid', issues);
    return issues;
  }
  if (!isPlainObject(value)) {
    issues.push(createIssue(ctx, 'stroke-style.value.invalid', { actualType: typeName(value) }));
    return issues;
  }
  if (!('dashArray' in value)) {
    issues.push(
      createIssue(ctx, 'composite.property.missing', {
        type: 'strokeStyle',
        property: 'dashArray',
        expectedType: 'dimension[]',
      }),
    );
  } else {
    const dctx = child(ctx, 'dashArray');
    const arr = value.dashArray;
    if (!Array.isArray(arr)) {
      issues.push(
        createIssue(dctx, 'stroke-style.dash-array.not-array', { actualType: typeName(arr) }),
      );
    } else {
      arr.forEach((item, i) => {
        issues.push(...validateSubValue(item, FIELDS.dashArray, child(dctx, String(i)), resolver));
      });
    }
  }
  if (!('lineCap' in value)) {
    issues.push(
      createIssue(ctx, 'composite.property.missing', {
        type: 'strokeStyle',
        property: 'lineCap',
        expectedType: 'lineCap',
      }),
    );
  } else {
    issues.push(
      ...validateSubValue(value.lineCap, FIELDS.lineCap, child(ctx, 'lineCap'), resolver),
    );
  }
  for (const key of Object.keys(value)) {
    if (!(key in FIELDS)) {
      issues.push(
        createIssue(child(ctx, key), 'value.unknown-property', {
          property: key,
          known: Object.keys(FIELDS),
        }),
      );
    }
  }
  return issues;
}
