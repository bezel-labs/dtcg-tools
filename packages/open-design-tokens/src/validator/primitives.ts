/**
 * Spec-check building blocks shared by the value validators. These encode what
 * the specification says and nothing more: there are no configurable limits.
 */
import type { ValidationIssue } from '../core/issue.js';
import { isFiniteNumber, isPlainObject } from '../core/predicates.js';
import type { ValidationContext } from './context.js';
import { createIssue } from './context.js';
import type {
  EnumMeta,
  IssueCode,
  IssueMeta,
  RangeMeta,
  ShapeMeta,
} from './specs/2025.10/messages.js';

export function typeName(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/** What a shape error reports: the type, and the value itself when it is small enough to show (a primitive). */
export function shapeOf(value: unknown): ShapeMeta {
  const meta: ShapeMeta = { actualType: typeName(value) };
  if (value === null || (typeof value !== 'object' && typeof value !== 'function'))
    meta.actual = value;
  return meta;
}

/** Codes whose `meta` is a `ShapeMeta`, so the shape helpers stay typed without widening `createIssue`. */
export type ShapeCode = {
  [C in IssueCode]: IssueMeta[C] extends ShapeMeta
    ? ShapeMeta extends IssueMeta[C]
      ? C
      : never
    : never;
}[IssueCode];

/** Pushes `code` unless `value` is a plain object. Returns whether it was. */
export function expectObject(
  value: unknown,
  ctx: ValidationContext,
  code: ShapeCode,
  issues: ValidationIssue[],
): value is Record<string, unknown> {
  if (isPlainObject(value)) return true;
  issues.push(createIssue(ctx, code, shapeOf(value)));
  return false;
}

export function expectArray(
  value: unknown,
  ctx: ValidationContext,
  code: ShapeCode,
  issues: ValidationIssue[],
): value is unknown[] {
  if (Array.isArray(value)) return true;
  issues.push(createIssue(ctx, code, shapeOf(value)));
  return false;
}

export function expectString(
  value: unknown,
  ctx: ValidationContext,
  code: ShapeCode,
  issues: ValidationIssue[],
): value is string {
  if (typeof value === 'string') return true;
  issues.push(createIssue(ctx, code, shapeOf(value)));
  return false;
}

/** JSON numbers are always finite; NaN/Infinity can only arrive from object input. */
export function expectFiniteNumber(
  value: unknown,
  ctx: ValidationContext,
  code: ShapeCode,
  issues: ValidationIssue[],
): value is number {
  if (isFiniteNumber(value)) return true;
  const meta = shapeOf(value);
  if (typeof value === 'number') {
    meta.actualType = 'non-finite number';
    meta.actual = String(value);
  }
  issues.push(createIssue(ctx, code, meta));
  return false;
}

export type EnumCode = { [C in IssueCode]: IssueMeta[C] extends EnumMeta ? C : never }[IssueCode];

export function expectEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  ctx: ValidationContext,
  code: EnumCode,
  issues: ValidationIssue[],
): value is T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return true;
  const meta: EnumMeta = { actual: value, allowed };
  if (typeof value === 'string') {
    const ci = allowed.find((a) => a.toLowerCase() === value.toLowerCase());
    if (ci) meta.suggestion = ci;
  }
  issues.push(createIssue(ctx, code, meta));
  return false;
}

export interface NumberRange {
  min?: number;
  max?: number;
  /** When true the upper bound is exclusive (hue angles: `[0, 360)`). */
  maxExclusive?: boolean;
}

/** Checks an already-finite number against a spec range. */
export type RangeCode = { [C in IssueCode]: IssueMeta[C] extends RangeMeta ? C : never }[IssueCode];

export function expectInRange<C extends RangeCode>(
  value: number,
  range: NumberRange,
  ctx: ValidationContext,
  code: C,
  issues: ValidationIssue[],
  extraMeta?: Omit<IssueMeta[C], keyof RangeMeta>,
): boolean {
  const belowMin = range.min !== undefined && value < range.min;
  const aboveMax =
    range.max !== undefined && (range.maxExclusive ? value >= range.max : value > range.max);
  if (!belowMin && !aboveMax) return true;
  const meta = {
    actual: value,
    min: range.min,
    max: range.max,
    maxExclusive: range.maxExclusive ?? false,
    ...extraMeta,
  } as IssueMeta[C];
  issues.push(createIssue(ctx, code, meta));
  return false;
}

/**
 * Reports properties that the spec does not define for a value object. The
 * spec is silent on extra keys, so this is a warning rather than an error.
 */
export function warnUnknownKeys(
  obj: Record<string, unknown>,
  known: readonly string[],
  ctx: ValidationContext,
  issues: ValidationIssue[],
): void {
  for (const key of Object.keys(obj)) {
    if (!known.includes(key)) {
      issues.push(createIssue(ctx, 'value.unknown-property', { property: key, known }));
    }
  }
}
