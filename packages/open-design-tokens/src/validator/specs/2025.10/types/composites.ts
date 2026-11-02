import type { LINE_CAPS, STROKE_STYLES } from '../constants.js';
import type { AliasOr } from './alias.js';
import type {
  ColorValue,
  CubicBezierValue,
  DimensionValue,
  DurationValue,
  FontFamilyValue,
  FontWeightValue,
  NumberValue,
} from './values.js';

export type StrokeStyleKeyword = (typeof STROKE_STYLES)[number];
export type LineCap = (typeof LINE_CAPS)[number];

export interface StrokeStyleObject {
  dashArray: AliasOr<DimensionValue>[];
  lineCap: LineCap;
}

export type StrokeStyleValue = StrokeStyleKeyword | StrokeStyleObject;

export interface BorderValue {
  color: AliasOr<ColorValue>;
  width: AliasOr<DimensionValue>;
  style: AliasOr<StrokeStyleValue>;
}

export interface TransitionValue {
  duration: AliasOr<DurationValue>;
  delay: AliasOr<DurationValue>;
  timingFunction: AliasOr<CubicBezierValue>;
}

export interface ShadowObject {
  color: AliasOr<ColorValue>;
  offsetX: AliasOr<DimensionValue>;
  offsetY: AliasOr<DimensionValue>;
  blur: AliasOr<DimensionValue>;
  spread: AliasOr<DimensionValue>;
  inset?: boolean;
}

/** A single shadow or a list of layered shadows. */
export type ShadowValue = ShadowObject | ShadowObject[];

export interface GradientStop {
  color: AliasOr<ColorValue>;
  /** Position in `[0, 1]`; values outside are clamped by consumers. */
  position: AliasOr<NumberValue>;
}

export type GradientValue = GradientStop[];

export interface TypographyValue {
  fontFamily: AliasOr<FontFamilyValue>;
  fontSize: AliasOr<DimensionValue>;
  fontWeight: AliasOr<FontWeightValue>;
  letterSpacing: AliasOr<DimensionValue>;
  lineHeight: AliasOr<NumberValue>;
}
