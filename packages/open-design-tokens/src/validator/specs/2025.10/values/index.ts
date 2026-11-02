import type { ValidationIssue } from '../../../../core/issue.js';
import type { ValidationContext } from '../../../context.js';
import type { PrimitiveTokenType } from '../types/token.js';
import { validateColorValue } from './color.js';
import { validateCubicBezierValue } from './cubic-bezier.js';
import { validateDimensionValue } from './dimension.js';
import { validateDurationValue } from './duration.js';
import { validateFontFamilyValue } from './font-family.js';
import { validateFontWeightValue } from './font-weight.js';
import { validateNumberValue } from './number.js';

export {
  validateColorValue,
  validateCubicBezierValue,
  validateDimensionValue,
  validateDurationValue,
  validateFontFamilyValue,
  validateFontWeightValue,
  validateNumberValue,
};

export type ValueValidator = (value: unknown, ctx: ValidationContext) => ValidationIssue[];

/** Value validator for each primitive `$type`. */
export const PRIMITIVE_VALUE_VALIDATORS: Record<PrimitiveTokenType, ValueValidator> = {
  color: validateColorValue,
  dimension: validateDimensionValue,
  fontFamily: validateFontFamilyValue,
  fontWeight: validateFontWeightValue,
  duration: validateDurationValue,
  cubicBezier: validateCubicBezierValue,
  number: validateNumberValue,
};
