/**
 * Enumerations from the Design Tokens Format Module 2025.10 and the Color
 * Module 2025.10. Every list exists once here; the TypeScript types in
 * `./types` are derived from them.
 */

export const SPEC_ID = '2025.10' as const;

export const PRIMITIVE_TOKEN_TYPES = [
  'color',
  'dimension',
  'fontFamily',
  'fontWeight',
  'duration',
  'cubicBezier',
  'number',
] as const;

export const COMPOSITE_TOKEN_TYPES = [
  'strokeStyle',
  'border',
  'transition',
  'shadow',
  'gradient',
  'typography',
] as const;

export const TOKEN_TYPES = [...PRIMITIVE_TOKEN_TYPES, ...COMPOSITE_TOKEN_TYPES] as const;

/** Reserved `$`-prefixed properties the format defines. */
export const RESERVED_PROPS = [
  '$value',
  '$type',
  '$description',
  '$extensions',
  '$deprecated',
  '$extends',
  '$schema',
] as const;

/** Characters that MUST NOT appear in token or group names. */
export const FORBIDDEN_NAME_CHARS = ['{', '}', '.'] as const;

/** Color Module 2025.10 color spaces. */
export const COLOR_SPACES = [
  'srgb',
  'srgb-linear',
  'hsl',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'display-p3',
  'a98-rgb',
  'prophoto-rgb',
  'rec2020',
  'xyz-d65',
  'xyz-d50',
] as const;

export interface ComponentRange {
  min: number;
  max: number;
  /** Hue components are in degrees with an exclusive upper bound. */
  hue?: true;
}

const UNIT: ComponentRange = { min: 0, max: 1 };
const PERCENT: ComponentRange = { min: 0, max: 100 };
const HUE: ComponentRange = { min: 0, max: 360, hue: true };
const RGB: readonly [ComponentRange, ComponentRange, ComponentRange] = [UNIT, UNIT, UNIT];

/** Allowed numeric range per component for each color space. */
export const COLOR_COMPONENT_RANGES: Record<
  (typeof COLOR_SPACES)[number],
  readonly [ComponentRange, ComponentRange, ComponentRange]
> = {
  srgb: RGB,
  'srgb-linear': RGB,
  hsl: [HUE, PERCENT, PERCENT],
  hwb: [HUE, PERCENT, PERCENT],
  lab: [PERCENT, { min: -125, max: 125 }, { min: -125, max: 125 }],
  lch: [PERCENT, { min: 0, max: 150 }, HUE],
  oklab: [UNIT, { min: -0.4, max: 0.4 }, { min: -0.4, max: 0.4 }],
  oklch: [UNIT, { min: 0, max: 0.4 }, HUE],
  'display-p3': RGB,
  'a98-rgb': RGB,
  'prophoto-rgb': RGB,
  rec2020: RGB,
  'xyz-d65': RGB,
  'xyz-d50': RGB,
};

export const DIMENSION_UNITS = ['px', 'rem'] as const;

export const DURATION_UNITS = ['ms', 's'] as const;

/** Font weight keyword aliases (case-sensitive) and their numeric values. */
export const FONT_WEIGHT_ALIASES = {
  thin: 100,
  hairline: 100,
  'extra-light': 200,
  'ultra-light': 200,
  light: 300,
  normal: 400,
  regular: 400,
  book: 400,
  medium: 500,
  'semi-bold': 600,
  'demi-bold': 600,
  bold: 700,
  'extra-bold': 800,
  'ultra-bold': 800,
  black: 900,
  heavy: 900,
  'extra-black': 950,
  'ultra-black': 950,
} as const;

export const FONT_WEIGHT_RANGE = { min: 1, max: 1000 } as const;

export const STROKE_STYLES = [
  'solid',
  'dashed',
  'dotted',
  'double',
  'groove',
  'ridge',
  'outset',
  'inset',
] as const;

export const LINE_CAPS = ['round', 'butt', 'square'] as const;

/**
 * Expected token type of each sub-value of a composite type. Used to validate
 * aliases inside composites and `$ref` pointers into sub-properties.
 */
export const SUB_FIELD_TYPES = {
  strokeStyle: { dashArray: 'dimension', lineCap: 'lineCap' },
  border: { color: 'color', width: 'dimension', style: 'strokeStyle' },
  transition: { duration: 'duration', delay: 'duration', timingFunction: 'cubicBezier' },
  shadow: {
    color: 'color',
    offsetX: 'dimension',
    offsetY: 'dimension',
    blur: 'dimension',
    spread: 'dimension',
  },
  gradient: { color: 'color', position: 'number' },
  typography: {
    fontFamily: 'fontFamily',
    fontSize: 'dimension',
    fontWeight: 'fontWeight',
    letterSpacing: 'dimension',
    lineHeight: 'number',
  },
} as const;
