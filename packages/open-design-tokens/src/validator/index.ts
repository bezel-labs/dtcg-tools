/**
 * Validator entry point: `import { validateDtcg } from 'open-design-tokens/validator'`.
 * Everything exported here is public API covered by semantic versioning.
 */

export type { IssuePath, Severity, ValidationIssue } from '../core/issue.js';
export { formatValue } from '../core/issue.js';
export { MAX_DEPTH } from '../core/limits.js';
export {
  escapePointerSegment,
  parseJsonPointer,
  toDotPath,
  toJsonPointer,
  unescapePointerSegment,
} from '../core/path.js';
export { isAlias, isAliasOrReference, isGroup, isReference, isToken } from '../core/predicates.js';
export type {
  NodeInfo,
  PreparedDocument,
  PrepareOptions,
  StructuralIssue,
} from '../core/prepare.js';
export { isPreparedDocument, prepareDocument } from '../core/prepare.js';
export type { Visitor } from '../core/walk.js';
export { getNodeAtPointer, walkDocument } from '../core/walk.js';
export type { ValidationContext } from './context.js';
export { createIssue, createRootContext } from './context.js';
export type { SpecId } from './registry.js';
export { LATEST_SPEC, SPEC_IDS } from './registry.js';
export type { ValidationResult, ValidationStats } from './result.js';
export type { RefParse } from './specs/2025.10/aliases/parse.js';
export { parseAlias, parseRef } from './specs/2025.10/aliases/parse.js';
export type {
  AliasResolution,
  Dereferenced,
  ExtendsTarget,
  MergedGroup,
  MergedMember,
  OwningToken,
  PathLookup,
  RefResolution,
  Resolver,
  Status,
} from './specs/2025.10/aliases/resolver.js';
export { createResolver } from './specs/2025.10/aliases/resolver.js';
export type { AliasCheck } from './specs/2025.10/aliases/validate-alias.js';
export { validateAliasToken } from './specs/2025.10/aliases/validate-alias.js';
export type { SubValueType, ValueValidator } from './specs/2025.10/composites/index.js';
export {
  VALUE_VALIDATORS,
  validateBorderValue,
  validateGradientValue,
  validateShadowValue,
  validateStrokeStyleValue,
  validateSubValue,
  validateTransitionValue,
  validateTypographyValue,
  validateValueOfType,
} from './specs/2025.10/composites/index.js';
export type { ComponentRange } from './specs/2025.10/constants.js';
// Spec 2025.10: enumerations, messages, types, and composable validators.
export {
  ALPHA_RANGE,
  COLOR_COMPONENT_RANGES,
  COLOR_SPACES,
  COMPOSITE_TOKEN_TYPES,
  CUBIC_BEZIER_X_RANGE,
  DIMENSION_UNITS,
  DURATION_UNITS,
  FONT_WEIGHT_ALIASES,
  FONT_WEIGHT_RANGE,
  GROUP_PROPS,
  LINE_CAPS,
  PRIMITIVE_TOKEN_TYPES,
  RESERVED_PROPS,
  ROOT_TOKEN_NAME,
  STROKE_STYLES,
  SUB_FIELD_TYPES,
  TOKEN_PROPS,
  TOKEN_TYPES,
} from './specs/2025.10/constants.js';
export { validateExtends } from './specs/2025.10/groups/validate-extends.js';
export { validateGroup } from './specs/2025.10/groups/validate-group.js';
export { validateNameCollisions } from './specs/2025.10/groups/validate-name-collisions.js';
export type { DocumentValidation } from './specs/2025.10/index.js';
export { validateDocument } from './specs/2025.10/index.js';
export type { IssueCode, MessageMeta } from './specs/2025.10/messages.js';
export { DEFAULT_SEVERITY, ISSUE_CODES, MESSAGES } from './specs/2025.10/messages.js';
export type { PropertyOwner } from './specs/2025.10/tokens/validate-common-props.js';
export {
  validateDeprecated,
  validateDescription,
  validateExtensions,
  validateType,
} from './specs/2025.10/tokens/validate-common-props.js';
export type { TokenValidation } from './specs/2025.10/tokens/validate-design-token.js';
export { validateDesignToken } from './specs/2025.10/tokens/validate-design-token.js';
export { validateName } from './specs/2025.10/tokens/validate-name.js';
export * from './specs/2025.10/types/index.js';
export {
  validateColorValue,
  validateCubicBezierValue,
  validateDimensionValue,
  validateDurationValue,
  validateFontFamilyValue,
  validateFontWeightValue,
  validateNumberValue,
} from './specs/2025.10/values/index.js';
export type { ValidateOptions } from './validate-dtcg.js';
export { validateDtcg } from './validate-dtcg.js';
