import type { COMPOSITE_TOKEN_TYPES, PRIMITIVE_TOKEN_TYPES, TOKEN_TYPES } from '../constants.js';
import type { AliasOr } from './alias.js';
import type {
  BorderValue,
  GradientValue,
  ShadowValue,
  StrokeStyleValue,
  TransitionValue,
  TypographyValue,
} from './composites.js';
import type {
  ColorValue,
  CubicBezierValue,
  DimensionValue,
  DurationValue,
  FontFamilyValue,
  FontWeightValue,
  NumberValue,
} from './values.js';

export type PrimitiveTokenType = (typeof PRIMITIVE_TOKEN_TYPES)[number];
export type CompositeTokenType = (typeof COMPOSITE_TOKEN_TYPES)[number];
export type TokenType = (typeof TOKEN_TYPES)[number];

/** Maps each `$type` to the shape of its `$value`. */
export interface TokenValueMap {
  color: ColorValue;
  dimension: DimensionValue;
  fontFamily: FontFamilyValue;
  fontWeight: FontWeightValue;
  duration: DurationValue;
  cubicBezier: CubicBezierValue;
  number: NumberValue;
  strokeStyle: StrokeStyleValue;
  border: BorderValue;
  transition: TransitionValue;
  shadow: ShadowValue;
  gradient: GradientValue;
  typography: TypographyValue;
}

export type ValueForType<T extends TokenType> = TokenValueMap[T];

/** Vendor extensions keyed by reverse-domain name. */
export type Extensions = Record<string, unknown>;

export interface TokenCommon {
  $description?: string;
  $deprecated?: boolean | string;
  $extensions?: Extensions;
}

/** A token whose `$type` is set explicitly. */
export type TypedToken<T extends TokenType = TokenType> = T extends TokenType
  ? TokenCommon & { $type: T; $value: AliasOr<ValueForType<T>> }
  : never;

/** A token that inherits its type from an ancestor group or an alias target. */
export interface UntypedToken extends TokenCommon {
  $type?: undefined;
  $value: unknown;
}

export type DesignToken = TypedToken | UntypedToken;

/** Narrows a token to a specific `$type`. Checks the explicit `$type` only. */
export function isTokenOfType<T extends TokenType>(
  token: DesignToken,
  type: T,
): token is TypedToken<T> {
  return token.$type === type;
}
