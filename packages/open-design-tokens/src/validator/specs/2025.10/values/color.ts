import type { ValidationIssue } from '../../../../core/issue.js';
import { hasOwn, isFiniteNumber } from '../../../../core/predicates.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import {
  expectArray,
  expectEnum,
  expectInRange,
  expectObject,
  expectString,
  typeName,
  warnUnknownKeys,
} from '../../../primitives.js';
import {
  ALPHA_RANGE,
  COLOR_COMPONENT_COUNT,
  COLOR_COMPONENT_RANGES,
  COLOR_SPACES,
  HEX_COLOR_RE,
} from '../constants.js';

const KNOWN_KEYS = ['colorSpace', 'components', 'alpha', 'hex'] as const;

/** Tolerance when comparing `hex` against sRGB components: one 8-bit step. */
const HEX_TOLERANCE = 1 / 255;

function toHex(components: readonly number[]): string {
  return `#${components
    .map((c) =>
      Math.round(Math.min(1, Math.max(0, c)) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

/**
 * Validates a `color` value per the Color Module 2025.10: a `colorSpace` from
 * the supported list, exactly three `components` that are numbers or `"none"`
 * within the space's ranges, an optional `alpha` in `[0, 1]`, and an optional
 * 6-digit `hex` fallback. For sRGB with all-numeric components, a `hex` that
 * disagrees with the components yields a warning.
 */
export function validateColorValue(value: unknown, ctx: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!expectObject(value, ctx, 'color.value.not-object', issues)) return issues;

  // colorSpace
  let colorSpace: (typeof COLOR_SPACES)[number] | undefined;
  if (!hasOwn(value, 'colorSpace')) {
    issues.push(createIssue(ctx, 'color.color-space.missing'));
  } else if (
    expectEnum(
      value.colorSpace,
      COLOR_SPACES,
      child(ctx, 'colorSpace'),
      'color.color-space.invalid',
      issues,
    )
  ) {
    colorSpace = value.colorSpace;
  }

  // components
  let numeric: number[] | undefined;
  if (!hasOwn(value, 'components')) {
    issues.push(createIssue(ctx, 'color.components.missing'));
  } else {
    const cctx = child(ctx, 'components');
    const comps = value.components;
    if (expectArray(comps, cctx, 'color.components.not-array', issues)) {
      if (comps.length !== COLOR_COMPONENT_COUNT) {
        issues.push(
          createIssue(cctx, 'color.components.wrong-length', {
            expected: COLOR_COMPONENT_COUNT,
            actual: comps.length,
            colorSpace: colorSpace ?? value.colorSpace,
          }),
        );
      }
      const ranges = colorSpace ? COLOR_COMPONENT_RANGES[colorSpace] : undefined;
      let allNumeric = comps.length === COLOR_COMPONENT_COUNT;
      comps.forEach((c, index) => {
        const ictx = child(cctx, String(index));
        if (c === 'none') {
          allNumeric = false;
          return;
        }
        if (!isFiniteNumber(c)) {
          allNumeric = false;
          issues.push(createIssue(ictx, 'color.component.invalid', { index, actual: c }));
          return;
        }
        const range = ranges?.[index];
        if (range) {
          expectInRange(c, range, ictx, 'color.component.out-of-range', issues, {
            index,
            name: range.name,
            colorSpace,
          });
        }
      });
      if (allNumeric) numeric = comps as number[];
    }
  }

  // alpha
  if (hasOwn(value, 'alpha')) {
    const actx = child(ctx, 'alpha');
    if (!isFiniteNumber(value.alpha)) {
      issues.push(
        createIssue(actx, 'color.alpha.not-number', { actualType: typeName(value.alpha) }),
      );
    } else {
      expectInRange(value.alpha, ALPHA_RANGE, actx, 'color.alpha.out-of-range', issues);
    }
  }

  // hex
  if (hasOwn(value, 'hex')) {
    const hctx = child(ctx, 'hex');
    if (expectString(value.hex, hctx, 'color.hex.invalid', issues)) {
      if (!HEX_COLOR_RE.test(value.hex)) {
        issues.push(createIssue(hctx, 'color.hex.invalid', { actual: value.hex }));
      } else if (colorSpace === 'srgb' && numeric) {
        const expected = toHex(numeric);
        const close = numeric.every((c, i) => {
          const fromHex =
            Number.parseInt((value.hex as string).slice(1 + i * 2, 3 + i * 2), 16) / 255;
          return Math.abs(fromHex - c) <= HEX_TOLERANCE + 1e-9;
        });
        if (!close) {
          issues.push(createIssue(hctx, 'color.hex.mismatch', { hex: value.hex, expected }));
        }
      }
    }
  }

  warnUnknownKeys(value, KNOWN_KEYS, ctx, issues);
  return issues;
}
