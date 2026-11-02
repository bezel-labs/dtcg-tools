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
  /** Human-readable component name used in diagnostics. */
  name: string;
  /** Omitted when the spec says the axis is unbounded. */
  min?: number;
  max?: number;
  /** Hue components are in degrees with an exclusive upper bound. */
  maxExclusive?: true;
}

const unit = (name: string): ComponentRange => ({ name, min: 0, max: 1 });
const percent = (name: string): ComponentRange => ({ name, min: 0, max: 100 });
const hue: ComponentRange = { name: 'hue', min: 0, max: 360, maxExclusive: true };
/** "Theoretically unbounded" per the Color Module; only finiteness is checked. */
const unbounded = (name: string): ComponentRange => ({ name });
const nonNegative = (name: string): ComponentRange => ({ name, min: 0 });
const RGB: readonly [ComponentRange, ComponentRange, ComponentRange] = [
  unit('red'),
  unit('green'),
  unit('blue'),
];
const XYZ: readonly [ComponentRange, ComponentRange, ComponentRange] = [
  unit('x'),
  unit('y'),
  unit('z'),
];

/** Allowed numeric range per component for each color space. Every supported space has 3 components. */
export const COLOR_COMPONENT_COUNT = 3;

export const COLOR_COMPONENT_RANGES: Record<
  (typeof COLOR_SPACES)[number],
  readonly [ComponentRange, ComponentRange, ComponentRange]
> = {
  srgb: RGB,
  'srgb-linear': RGB,
  hsl: [hue, percent('saturation'), percent('lightness')],
  hwb: [hue, percent('whiteness'), percent('blackness')],
  lab: [percent('lightness'), unbounded('a'), unbounded('b')],
  lch: [percent('lightness'), nonNegative('chroma'), hue],
  oklab: [unit('lightness'), unbounded('a'), unbounded('b')],
  oklch: [unit('lightness'), nonNegative('chroma'), hue],
  'display-p3': RGB,
  'a98-rgb': RGB,
  'prophoto-rgb': RGB,
  rec2020: RGB,
  'xyz-d65': XYZ,
  'xyz-d50': XYZ,
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

export const ALPHA_RANGE = { min: 0, max: 1 } as const;

/** 6-digit CSS hex color, the only form the Color Module allows for `hex`. */
export const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export const CUBIC_BEZIER_X_RANGE = { min: 0, max: 1 } as const;

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
