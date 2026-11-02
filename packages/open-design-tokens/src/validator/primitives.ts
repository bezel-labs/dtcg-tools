/**
 * Spec-check building blocks shared by the value validators. These encode what
 * the specification says and nothing more: there are no configurable limits.
 */
import type { ValidationIssue } from '../core/issue.js';
import { isFiniteNumber, isPlainObject } from '../core/predicates.js';
import type { ValidationContext } from './context.js';
import { createIssue } from './context.js';
import type { IssueCode } from './specs/2025.10/messages.js';

export function typeName(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/** Pushes `code` unless `value` is a plain object. Returns whether it was. */
export function expectObject(
  value: unknown,
  ctx: ValidationContext,
  code: IssueCode,
  issues: ValidationIssue[],
): value is Record<string, unknown> {
  if (isPlainObject(value)) return true;
  issues.push(createIssue(ctx, code, { actualType: typeName(value) }));
  return false;
}

export function expectArray(
  value: unknown,
  ctx: ValidationContext,
  code: IssueCode,
  issues: ValidationIssue[],
): value is unknown[] {
  if (Array.isArray(value)) return true;
  issues.push(createIssue(ctx, code, { actualType: typeName(value) }));
  return false;
}

export function expectString(
  value: unknown,
  ctx: ValidationContext,
  code: IssueCode,
  issues: ValidationIssue[],
): value is string {
  if (typeof value === 'string') return true;
  issues.push(createIssue(ctx, code, { actualType: typeName(value) }));
  return false;
}

/** JSON numbers are always finite; NaN/Infinity can only arrive from object input. */
export function expectFiniteNumber(
  value: unknown,
  ctx: ValidationContext,
  code: IssueCode,
  issues: ValidationIssue[],
): value is number {
  if (isFiniteNumber(value)) return true;
  issues.push(
    createIssue(ctx, code, {
      actualType: typeof value === 'number' ? 'non-finite number' : typeName(value),
      actual: typeof value === 'number' ? String(value) : value,
    }),
  );
  return false;
}

export function expectEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  ctx: ValidationContext,
  code: IssueCode,
  issues: ValidationIssue[],
): value is T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return true;
  const meta: Record<string, unknown> = { actual: value, allowed };
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
export function expectInRange(
  value: number,
  range: NumberRange,
  ctx: ValidationContext,
  code: IssueCode,
  issues: ValidationIssue[],
  extraMeta?: Record<string, unknown>,
): boolean {
  const belowMin = range.min !== undefined && value < range.min;
  const aboveMax =
    range.max !== undefined && (range.maxExclusive ? value >= range.max : value > range.max);
  if (!belowMin && !aboveMax) return true;
  issues.push(
    createIssue(ctx, code, {
      actual: value,
      min: range.min,
      max: range.max,
      maxExclusive: range.maxExclusive ?? false,
      ...extraMeta,
    }),
  );
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
