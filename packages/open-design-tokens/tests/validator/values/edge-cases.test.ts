import { describe, expect, it } from 'vitest';
import { createRootContext } from '../../../src/validator/context.js';
import {
  validateColorValue,
  validateCubicBezierValue,
  validateDimensionValue,
  validateFontWeightValue,
  validateNumberValue,
} from '../../../src/validator/index.js';

const ctx = createRootContext('2025.10');
const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

/** Edge cases that cannot be expressed in JSON fixtures (NaN, Infinity) or that check meta. */
describe('value validators: non-JSON numbers', () => {
  it('number rejects NaN and Infinity', () => {
    expect(codes(validateNumberValue(Number.NaN, ctx))).toEqual(['number.value.not-number']);
    expect(codes(validateNumberValue(Number.POSITIVE_INFINITY, ctx))).toEqual([
      'number.value.not-number',
    ]);
  });

  it('dimension rejects a NaN value', () => {
    expect(codes(validateDimensionValue({ value: Number.NaN, unit: 'px' }, ctx))).toEqual([
      'dimension.value.not-number',
    ]);
  });

  it('font weight rejects NaN and Infinity as invalid, not out-of-range', () => {
    expect(codes(validateFontWeightValue(Number.NaN, ctx))).toEqual(['font-weight.value.invalid']);
    expect(codes(validateFontWeightValue(Number.NEGATIVE_INFINITY, ctx))).toEqual([
      'font-weight.value.invalid',
    ]);
  });

  it('color rejects NaN components and alpha', () => {
    const issues = validateColorValue(
      { colorSpace: 'srgb', components: [Number.NaN, 0, 0], alpha: Number.POSITIVE_INFINITY },
      ctx,
    );
    expect(codes(issues)).toEqual(['color.component.invalid', 'color.alpha.not-number']);
  });

  it('cubic bezier rejects NaN coordinates', () => {
    expect(codes(validateCubicBezierValue([Number.NaN, 0, 1, 1], ctx))).toEqual([
      'cubic-bezier.point.not-number',
    ]);
  });
});

describe('value validators: diagnostics metadata', () => {
  it('suggests the correctly cased enum value', () => {
    const [issue] = validateColorValue({ colorSpace: 'OKLCH', components: [0.5, 0.1, 10] }, ctx);
    expect(issue?.code).toBe('color.color-space.invalid');
    expect(issue?.meta?.suggestion).toBe('oklch');
    expect(issue?.message).toContain('Did you mean "oklch"');
  });

  it('suggests the correctly cased font weight keyword', () => {
    const [issue] = validateFontWeightValue('Extra-Bold', ctx);
    expect(issue?.meta?.suggestion).toBe('extra-bold');
  });

  it('reports hue range as exclusive', () => {
    const [issue] = validateColorValue({ colorSpace: 'hsl', components: [360, 0, 0] }, ctx);
    expect(issue?.meta).toMatchObject({
      min: 0,
      max: 360,
      maxExclusive: true,
      index: 0,
      name: 'hue',
    });
    expect(issue?.message).toContain('[0, 360)');
  });

  it('hex mismatch tolerates one 8-bit step', () => {
    const near = validateColorValue(
      { colorSpace: 'srgb', components: [0.5, 0.5, 0.5], hex: '#808080' },
      ctx,
    );
    expect(near).toEqual([]);
    const far = validateColorValue(
      { colorSpace: 'srgb', components: [0.5, 0.5, 0.5], hex: '#848484' },
      ctx,
    );
    expect(codes(far)).toEqual(['color.hex.mismatch']);
    expect(far[0]?.meta?.expected).toBe('#808080');
  });

  it('skips the hex comparison when a component is "none"', () => {
    expect(
      validateColorValue({ colorSpace: 'srgb', components: ['none', 0, 0], hex: '#00ff00' }, ctx),
    ).toEqual([]);
  });

  it('paths point at the offending element', () => {
    const issues = validateColorValue({ colorSpace: 'srgb', components: [0, 2, 0] }, ctx);
    expect(issues[0]?.path).toEqual({ pointer: '/components/1', dot: 'components.1' });
  });
});
