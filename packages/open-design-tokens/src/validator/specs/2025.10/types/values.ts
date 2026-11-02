import type {
  COLOR_SPACES,
  DIMENSION_UNITS,
  DURATION_UNITS,
  FONT_WEIGHT_ALIASES,
} from '../constants.js';

export type ColorSpace = (typeof COLOR_SPACES)[number];

/** A color component: a number, or `'none'` for a missing component. */
export type ColorComponent = number | 'none';

export interface ColorValue {
  colorSpace: ColorSpace;
  components: [ColorComponent, ColorComponent, ColorComponent];
  alpha?: number;
  /** Fallback sRGB hex (`#rrggbb`). */
  hex?: string;
}

export type DimensionUnit = (typeof DIMENSION_UNITS)[number];

export interface DimensionValue {
  value: number;
  unit: DimensionUnit;
}

/** A single family name or an ordered list of fallbacks. */
export type FontFamilyValue = string | string[];

export type FontWeightKeyword = keyof typeof FONT_WEIGHT_ALIASES;

/** A number in `[1, 1000]` or a case-sensitive keyword. */
export type FontWeightValue = number | FontWeightKeyword;

export type DurationUnit = (typeof DURATION_UNITS)[number];

export interface DurationValue {
  value: number;
  unit: DurationUnit;
}

/** `[x1, y1, x2, y2]` with `x1` and `x2` in `[0, 1]`. */
export type CubicBezierValue = [number, number, number, number];

export type NumberValue = number;
