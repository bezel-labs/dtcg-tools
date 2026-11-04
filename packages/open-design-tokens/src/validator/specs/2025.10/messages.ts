import type { Severity, ValidationIssue } from '../../../core/issue.js';
import { formatValue } from '../../../core/issue.js';
import { MAX_DEPTH } from '../../../core/limits.js';

/**
 * Every issue the 2025.10 validator can emit. Codes are stable public API and
 * follow `<section>.<field>.<problem>`.
 */
export type IssueCode =
  // document
  | 'document.not-object'
  | 'document.invalid-json'
  | 'document.too-deep'
  | 'document.circular'
  | 'document.unreadable-node'
  // generic value objects
  | 'value.unknown-property'
  // §5.1 / §6 names
  | 'name.forbidden-character'
  | 'name.reserved-prefix'
  | 'name.empty'
  // §5 tokens
  | 'token.type.missing'
  | 'token.type.invalid'
  | 'token.type.not-string'
  | 'token.description.not-string'
  | 'token.deprecated.invalid'
  | 'token.extensions.not-object'
  | 'token.extensions.key-not-namespaced'
  | 'token.property.unknown'
  | 'token.property.not-allowed'
  // §6 groups
  | 'group.description.not-string'
  | 'group.type.invalid'
  | 'group.type.not-string'
  | 'group.deprecated.invalid'
  | 'group.extensions.not-object'
  | 'group.extensions.key-not-namespaced'
  | 'group.extends.invalid'
  | 'group.ref.invalid'
  | 'group.property.unknown'
  | 'group.member.invalid'
  | 'group.root.not-token'
  | 'group.name.case-collision'
  // §7 aliases (curly braces)
  | 'alias.syntax.invalid'
  | 'alias.target.missing'
  | 'alias.target.not-token'
  | 'alias.cycle'
  | 'alias.type.mismatch'
  // §7 references ($ref JSON pointers)
  | 'ref.not-local'
  | 'ref.syntax.invalid'
  | 'ref.target.missing'
  | 'ref.cycle'
  | 'ref.type.mismatch'
  // §6.4 group extension
  | 'extends.target.missing'
  | 'extends.target.not-group'
  | 'extends.cycle'
  | 'extends.inherited-token.invalid'
  // §9 composites
  | 'composite.property.missing'
  | 'composite.value.not-object'
  | 'stroke-style.value.invalid'
  | 'stroke-style.keyword.invalid'
  | 'stroke-style.dash-array.not-array'
  | 'stroke-style.line-cap.invalid'
  | 'shadow.value.invalid'
  | 'shadow.item.invalid'
  | 'shadow.inset.not-boolean'
  | 'gradient.value.not-array'
  | 'gradient.stop.invalid'
  | 'gradient.position.out-of-range'
  // §8.1 color (Color Module 2025.10)
  | 'color.value.not-object'
  | 'color.color-space.missing'
  | 'color.color-space.invalid'
  | 'color.components.missing'
  | 'color.components.not-array'
  | 'color.components.wrong-length'
  | 'color.component.invalid'
  | 'color.component.out-of-range'
  | 'color.alpha.not-number'
  | 'color.alpha.out-of-range'
  | 'color.hex.invalid'
  | 'color.hex.mismatch'
  // §8.2 dimension
  | 'dimension.value.not-object'
  | 'dimension.value.missing'
  | 'dimension.value.not-number'
  | 'dimension.unit.missing'
  | 'dimension.unit.invalid'
  // §8.3 font family
  | 'font-family.value.invalid'
  | 'font-family.name.not-string'
  // §8.4 font weight
  | 'font-weight.value.invalid'
  | 'font-weight.number.out-of-range'
  | 'font-weight.keyword.invalid'
  // §8.5 duration
  | 'duration.value.not-object'
  | 'duration.value.missing'
  | 'duration.value.not-number'
  | 'duration.unit.missing'
  | 'duration.unit.invalid'
  // §8.6 cubic bézier
  | 'cubic-bezier.value.not-array'
  | 'cubic-bezier.value.wrong-length'
  | 'cubic-bezier.point.not-number'
  | 'cubic-bezier.x.out-of-range'
  // §8.7 number
  | 'number.value.not-number';

/** No structured details: the code and path say everything. */
export type EmptyMeta = Record<string, never>;
/** The JSON type a value turned out to have, plus the value itself when it is a primitive. */
export type ShapeMeta = {
  actualType: string;
  /** The offending value when it is a string, number, boolean, or null; omitted for objects and arrays. */
  actual?: unknown;
};
/** A value that had to be one of a fixed set of strings. */
export type EnumMeta = {
  actual: unknown;
  allowed: readonly string[];
  /** The allowed value that differs from `actual` only by case, when there is one. */
  suggestion?: string | undefined;
};
/** A number outside its allowed range. */
export type RangeMeta = {
  actual: number;
  min?: number | undefined;
  max?: number | undefined;
  maxExclusive: boolean;
};

/**
 * The structured details (`meta`) each issue code carries, so clients can build their own
 * messages or UI from the data rather than parsing the English sentence. Public API: keys are
 * only added, never renamed or removed, without a major version.
 */
export interface IssueMeta {
  'document.not-object': ShapeMeta;
  'document.invalid-json': { reason: string };
  'document.too-deep': { depth: number };
  'document.circular': EmptyMeta;
  'document.unreadable-node': { reason: string };
  'value.unknown-property': { property: string; known: readonly string[] };
  'name.forbidden-character': { name: string; character: string };
  'name.reserved-prefix': { name: string };
  'name.empty': EmptyMeta;
  'token.type.missing': {
    actualValueType?: string | undefined;
    via?: 'alias' | undefined;
    target?: string | undefined;
  };
  'token.type.invalid': EnumMeta;
  'token.type.not-string': ShapeMeta;
  'token.description.not-string': ShapeMeta;
  'token.deprecated.invalid': ShapeMeta;
  'token.extensions.not-object': ShapeMeta;
  'token.extensions.key-not-namespaced': { key: string };
  'token.property.unknown': { property: string };
  'token.property.not-allowed': { property: string };
  'group.description.not-string': ShapeMeta;
  'group.type.invalid': EnumMeta;
  'group.type.not-string': ShapeMeta;
  'group.deprecated.invalid': ShapeMeta;
  'group.extensions.not-object': ShapeMeta;
  'group.extensions.key-not-namespaced': { key: string };
  'group.extends.invalid': { actual: unknown };
  'group.ref.invalid': { actual: unknown };
  'group.property.unknown': { property: string };
  'group.member.invalid': { name: string; actualType: string };
  'group.root.not-token': EmptyMeta;
  'group.name.case-collision': { names: readonly string[] };
  'alias.syntax.invalid': { actual: unknown };
  'alias.target.missing': { alias: string; actual?: string | undefined; path: string };
  'alias.target.not-token': { alias: string; path: string };
  'alias.cycle': { chain: readonly string[] };
  'alias.type.mismatch': {
    alias: string;
    actual: string;
    actualType?: string | undefined;
    expected: string;
    target: string;
  };
  'ref.not-local': { actual: unknown };
  'ref.syntax.invalid': { actual: unknown };
  'ref.target.missing': { alias?: string | undefined; actual: string; path: string };
  'ref.cycle': { chain: readonly string[] };
  'ref.type.mismatch': {
    alias?: string | undefined;
    actual: string;
    actualType: string;
    expected: string;
    target: string;
  };
  'extends.target.missing': { actual: unknown; path: string };
  'extends.target.not-group': { actual: unknown; path: string };
  'extends.cycle': { chain: readonly string[] };
  'extends.inherited-token.invalid': {
    token: string;
    inheritedFrom: string;
    effectiveType?: string | undefined;
    originType?: string | undefined;
    reason: string;
  };
  'composite.property.missing': { type: string; property: string; expectedType: string };
  'composite.value.not-object': { type: string; properties: readonly string[]; actualType: string };
  'stroke-style.value.invalid': ShapeMeta;
  'stroke-style.keyword.invalid': EnumMeta;
  'stroke-style.dash-array.not-array': ShapeMeta;
  'stroke-style.line-cap.invalid': EnumMeta;
  'shadow.value.invalid': ShapeMeta;
  'shadow.item.invalid': { index: number; actualType: string };
  'shadow.inset.not-boolean': ShapeMeta;
  'gradient.value.not-array': ShapeMeta;
  'gradient.stop.invalid': { index: number; actualType: string };
  'gradient.position.out-of-range': { actual: number };
  'color.value.not-object': ShapeMeta;
  'color.color-space.missing': EmptyMeta;
  'color.color-space.invalid': EnumMeta;
  'color.components.missing': EmptyMeta;
  'color.components.not-array': ShapeMeta;
  'color.components.wrong-length': { expected: number; actual: number; colorSpace: unknown };
  'color.component.invalid': { index: number; actual: unknown };
  'color.component.out-of-range': RangeMeta & {
    index: number;
    name: string;
    colorSpace: string | undefined;
  };
  'color.alpha.not-number': ShapeMeta;
  'color.alpha.out-of-range': RangeMeta;
  'color.hex.invalid': { actualType?: string | undefined; actual: unknown };
  'color.hex.mismatch': { hex: string; expected: string };
  'dimension.value.not-object': ShapeMeta;
  'dimension.value.missing': EmptyMeta;
  'dimension.value.not-number': ShapeMeta;
  'dimension.unit.missing': EmptyMeta;
  'dimension.unit.invalid': EnumMeta;
  'font-family.value.invalid': ShapeMeta;
  'font-family.name.not-string': { index: number; actualType: string };
  'font-weight.value.invalid': ShapeMeta;
  'font-weight.number.out-of-range': RangeMeta;
  'font-weight.keyword.invalid': EnumMeta;
  'duration.value.not-object': ShapeMeta;
  'duration.value.missing': EmptyMeta;
  'duration.value.not-number': ShapeMeta;
  'duration.unit.missing': EmptyMeta;
  'duration.unit.invalid': EnumMeta;
  'cubic-bezier.value.not-array': ShapeMeta;
  'cubic-bezier.value.wrong-length': { actual: number };
  'cubic-bezier.point.not-number': { index: number; actualType: string };
  'cubic-bezier.x.out-of-range': RangeMeta & { index: number };
  'number.value.not-number': ShapeMeta;
}

/** @deprecated Use `IssueMeta[code]`; kept as the loose shape for callers that do not narrow. */
export type MessageMeta = Record<string, unknown>;

/** A message for every code, built from that code's typed `meta`. Pass a partial one to override wording. */
export type MessageCatalog = { [C in IssueCode]: (meta: IssueMeta[C]) => string };

/** A validator issue whose `meta` is typed by its `code`: narrow on `code` to read the details safely. */
export type SpecIssue = {
  [C in IssueCode]: Omit<ValidationIssue, 'code' | 'meta'> & { code: C; meta?: IssueMeta[C] };
}[IssueCode];

function range(m: {
  min?: number | undefined;
  max?: number | undefined;
  maxExclusive?: boolean | undefined;
}): string {
  const min = m.min === undefined ? '-∞' : String(m.min);
  const max = m.max === undefined ? '∞' : String(m.max);
  return `[${min}, ${max}${m.maxExclusive ? ')' : ']'}`;
}

function list(values: unknown): string {
  return Array.isArray(values) ? values.map((v) => formatValue(v)).join(', ') : formatValue(values);
}

function suggest(m: { suggestion?: string | undefined }): string {
  return m.suggestion === undefined
    ? ''
    : ` Did you mean ${formatValue(m.suggestion)}? Values are case-sensitive.`;
}

/** "received the string "#zzz"" when the offending value is a primitive, else just its type. */
function received(m: ShapeMeta): string {
  return m.actual === undefined
    ? formatValue(m.actualType)
    : `the ${m.actualType} ${formatValue(m.actual)}`;
}

/** Message catalog (English). Values come from `meta` and are always passed through `formatValue`. */
export const MESSAGES: MessageCatalog = {
  'document.not-object': (m) => `The document root must be a JSON object, received ${received(m)}.`,
  'document.invalid-json': (m) => `The input is not valid JSON: ${formatValue(m.reason)}.`,
  'document.too-deep': () =>
    `The document nests groups deeper than the supported limit of ${MAX_DEPTH} levels.`,
  'document.circular': () =>
    'The input object contains a circular reference and cannot be validated.',
  'document.unreadable-node': (m) =>
    `A property could not be read while validating: ${formatValue(m.reason)}.`,

  'value.unknown-property': (m) =>
    `Property ${formatValue(m.property)} is not defined for this value type. Known properties: ${list(m.known)}.`,

  'name.forbidden-character': (m) =>
    `Name ${formatValue(m.name)} contains ${formatValue(m.character)}, which is not allowed in token or group names (reserved for alias syntax).`,
  'name.reserved-prefix': (m) =>
    `Name ${formatValue(m.name)} starts with "$", which is reserved for format properties; token and group names must not begin with "$".`,
  'name.empty': () => 'Token and group names should not be empty.',

  'token.type.missing': () =>
    'The token has no $type and none can be inherited from a parent group, so its type cannot be determined.',
  'token.type.invalid': (m) =>
    `Unknown $type ${formatValue(m.actual)}. Allowed: ${list(m.allowed)}.${suggest(m)}`,
  'token.type.not-string': (m) => `$type must be a string, received ${received(m)}.`,
  'token.description.not-string': (m) =>
    `$description must be a plain string, received ${received(m)}.`,
  'token.deprecated.invalid': (m) =>
    `$deprecated must be true, false, or a string explanation, received ${received(m)}.`,
  'token.extensions.not-object': (m) => `$extensions must be an object, received ${received(m)}.`,
  'token.extensions.key-not-namespaced': (m) =>
    `$extensions key ${formatValue(m.key)} should use reverse domain name notation (for example "com.example.tool") to avoid clashes.`,
  'token.property.unknown': (m) =>
    `Property ${formatValue(m.property)} is not defined for tokens by this specification version and will be ignored.`,
  'token.property.not-allowed': (m) =>
    `Property ${formatValue(m.property)} is not allowed on a token: an object with $value cannot also contain child tokens or groups.`,

  'group.description.not-string': (m) =>
    `$description must be a plain string, received ${received(m)}.`,
  'group.type.invalid': (m) =>
    `Unknown group $type ${formatValue(m.actual)}. Allowed: ${list(m.allowed)}.${suggest(m)}`,
  'group.type.not-string': (m) => `$type must be a string, received ${received(m)}.`,
  'group.deprecated.invalid': (m) =>
    `$deprecated must be true, false, or a string explanation, received ${received(m)}.`,
  'group.extensions.not-object': (m) => `$extensions must be an object, received ${received(m)}.`,
  'group.extensions.key-not-namespaced': (m) =>
    `$extensions key ${formatValue(m.key)} should use reverse domain name notation (for example "com.example.tool") to avoid clashes.`,
  'group.extends.invalid': (m) =>
    `$extends must be a group reference such as "{group.name}", received ${formatValue(m.actual)}.`,
  'group.ref.invalid': (m) =>
    `$ref on a group must be a local JSON pointer such as "#/group/name", received ${formatValue(m.actual)}.`,
  'group.property.unknown': (m) =>
    `Property ${formatValue(m.property)} is not defined for groups by this specification version. Names must not start with "$".`,
  'group.member.invalid': (m) =>
    `Member ${formatValue(m.name)} must be a token or a group (an object), received ${formatValue(m.actualType)}.`,
  'group.root.not-token': () =>
    'The reserved "$root" member must be a token (an object with $value).',
  'group.name.case-collision': (m) =>
    `Names ${list(m.names)} differ only by case; tools that transform names may produce duplicates.`,

  'alias.syntax.invalid': (m) =>
    `Alias ${formatValue(m.actual)} is malformed. Use "{group.token}" with non-empty, dot-separated names.`,
  'alias.target.missing': (m) =>
    `Alias ${formatValue(m.alias)} does not resolve: no token at ${formatValue(m.path)}.`,
  'alias.target.not-token': (m) =>
    `Alias ${formatValue(m.alias)} points at a group, not a token. Curly-brace aliases can only target tokens (use "{${String(m.path ?? '')}.$root}" for a group's root token).`,
  'alias.cycle': (m) =>
    `Circular alias chain: ${list(m.chain)}. The value of every token in the chain is unknown.`,
  'alias.type.mismatch': (m) =>
    `Alias ${formatValue(m.alias)} resolves to a ${formatValue(m.actual)} token but this token is declared as ${formatValue(m.expected)}.`,

  'ref.not-local': (m) =>
    `$ref ${formatValue(m.actual)} must point inside this document and start with "#/". External and remote references are not supported.`,
  'ref.syntax.invalid': (m) =>
    `$ref ${formatValue(m.actual)} is not a valid JSON pointer (RFC 6901).`,
  'ref.target.missing': (m) =>
    `$ref ${formatValue(m.actual)} does not resolve: nothing exists at that location.`,
  'ref.cycle': (m) => `Circular reference chain: ${list(m.chain)}.`,
  'ref.type.mismatch': (m) =>
    `$ref ${formatValue(m.actual)} resolves to a ${formatValue(m.actualType)} token but this token is declared as ${formatValue(m.expected)}.`,

  'extends.target.missing': (m) =>
    `$extends ${formatValue(m.actual)} does not resolve: no group at ${formatValue(m.path)}.`,
  'extends.target.not-group': (m) =>
    `$extends ${formatValue(m.actual)} must reference a group, but ${formatValue(m.path)} is a token.`,
  'extends.cycle': (m) =>
    `Circular group extension: ${list(m.chain)}. A group cannot extend itself, an ancestor, or a group that extends it.`,
  'extends.inherited-token.invalid': (m) =>
    `Token ${formatValue(m.token)} inherited from ${formatValue(m.inheritedFrom)} is invalid in this group: ${formatValue(m.reason)}.`,

  'composite.property.missing': (m) =>
    `A ${formatValue(m.type)} value must have a ${formatValue(m.property)} property (${formatValue(m.expectedType)} value or reference).`,
  'composite.value.not-object': (m) =>
    `A ${formatValue(m.type)} value must be an object with ${list(m.properties)}, received ${formatValue(m.actualType)}.`,
  'stroke-style.value.invalid': (m) =>
    `A strokeStyle value must be a keyword string or an object with "dashArray" and "lineCap", received ${received(m)}.`,
  'stroke-style.keyword.invalid': (m) =>
    `Unknown stroke style ${formatValue(m.actual)}. Allowed: ${list(m.allowed)}.${suggest(m)}`,
  'stroke-style.dash-array.not-array': (m) =>
    `"dashArray" must be an array of dimension values or references, received ${received(m)}.`,
  'stroke-style.line-cap.invalid': (m) =>
    `"lineCap" must be one of ${list(m.allowed)}, received ${formatValue(m.actual)}.${suggest(m)}`,
  'shadow.value.invalid': (m) =>
    `A shadow value must be a shadow object or an array of shadow objects and references, received ${received(m)}.`,
  'shadow.item.invalid': (m) =>
    `Shadow entry ${formatValue(m.index)} must be a shadow object or a reference to a shadow token, received ${formatValue(m.actualType)}.`,
  'shadow.inset.not-boolean': (m) => `"inset" must be true or false, received ${received(m)}.`,
  'gradient.value.not-array': (m) =>
    `A gradient value must be an array of gradient stops and references, received ${received(m)}.`,
  'gradient.stop.invalid': (m) =>
    `Gradient entry ${formatValue(m.index)} must be a stop object with "color" and "position" or a reference to a gradient token, received ${formatValue(m.actualType)}.`,
  'gradient.position.out-of-range': (m) =>
    `Gradient stop position ${formatValue(m.actual)} is outside [0, 1] and will be clamped by consumers.`,

  'color.value.not-object': (m) =>
    `A color value must be an object with "colorSpace" and "components", received ${received(m)}.`,
  'color.color-space.missing': () => 'A color value must have a "colorSpace" property.',
  'color.color-space.invalid': (m) =>
    `Unsupported color space ${formatValue(m.actual)}. Supported: ${list(m.allowed)}.${suggest(m)}`,
  'color.components.missing': () => 'A color value must have a "components" array.',
  'color.components.not-array': (m) => `"components" must be an array, received ${received(m)}.`,
  'color.components.wrong-length': (m) =>
    `"components" must have exactly ${formatValue(m.expected)} entries for ${formatValue(m.colorSpace)}, received ${formatValue(m.actual)}.`,
  'color.component.invalid': (m) =>
    `Color component ${formatValue(m.index)} must be a number or "none", received ${formatValue(m.actual)}.`,
  'color.component.out-of-range': (m) =>
    `Color component ${formatValue(m.index)} (${formatValue(m.name)}) of ${formatValue(m.colorSpace)} must be in ${range(m)}, received ${formatValue(m.actual)}.`,
  'color.alpha.not-number': (m) => `"alpha" must be a number, received ${received(m)}.`,
  'color.alpha.out-of-range': (m) =>
    `"alpha" must be in [0, 1], received ${formatValue(m.actual)}.`,
  'color.hex.invalid': (m) =>
    `"hex" must be a 6-digit CSS hex color such as "#ff00ff", received ${formatValue(m.actual)}.`,
  'color.hex.mismatch': (m) =>
    `"hex" ${formatValue(m.hex)} does not match the sRGB components (expected ${formatValue(m.expected)}).`,

  'dimension.value.not-object': (m) =>
    `A dimension value must be an object with "value" and "unit", received ${received(m)}.`,
  'dimension.value.missing': () => 'A dimension value must have a "value" property.',
  'dimension.value.not-number': (m) =>
    `Dimension "value" must be a number, received ${received(m)}.`,
  'dimension.unit.missing': () =>
    'A dimension value must have a "unit" property, even when "value" is 0.',
  'dimension.unit.invalid': (m) =>
    `Dimension "unit" must be one of ${list(m.allowed)}, received ${formatValue(m.actual)}.${suggest(m)}`,

  'font-family.value.invalid': (m) =>
    `A font family value must be a string or an array of strings, received ${received(m)}.`,
  'font-family.name.not-string': (m) =>
    `Font family entry ${formatValue(m.index)} must be a string, received ${formatValue(m.actualType)}.`,

  'font-weight.value.invalid': (m) =>
    `A font weight value must be a number in [1, 1000] or a keyword, received ${received(m)}.`,
  'font-weight.number.out-of-range': (m) =>
    `Font weight must be in [1, 1000], received ${formatValue(m.actual)}.`,
  'font-weight.keyword.invalid': (m) =>
    `Unknown font weight keyword ${formatValue(m.actual)}. Allowed: ${list(m.allowed)}.${suggest(m)}`,

  'duration.value.not-object': (m) =>
    `A duration value must be an object with "value" and "unit", received ${received(m)}.`,
  'duration.value.missing': () => 'A duration value must have a "value" property.',
  'duration.value.not-number': (m) => `Duration "value" must be a number, received ${received(m)}.`,
  'duration.unit.missing': () => 'A duration value must have a "unit" property.',
  'duration.unit.invalid': (m) =>
    `Duration "unit" must be one of ${list(m.allowed)}, received ${formatValue(m.actual)}.${suggest(m)}`,

  'cubic-bezier.value.not-array': (m) =>
    `A cubic Bézier value must be an array of four numbers, received ${received(m)}.`,
  'cubic-bezier.value.wrong-length': (m) =>
    `A cubic Bézier value must have exactly 4 numbers [P1x, P1y, P2x, P2y], received ${formatValue(m.actual)}.`,
  'cubic-bezier.point.not-number': (m) =>
    `Cubic Bézier coordinate ${formatValue(m.index)} must be a number, received ${formatValue(m.actualType)}.`,
  'cubic-bezier.x.out-of-range': (m) =>
    `Cubic Bézier x coordinate ${formatValue(m.index)} must be in [0, 1], received ${formatValue(m.actual)}.`,

  'number.value.not-number': (m) =>
    `A number value must be a JSON number, received ${received(m)}.`,
};

export const DEFAULT_SEVERITY: Record<IssueCode, Severity> = {
  'document.not-object': 'error',
  'document.invalid-json': 'error',
  'document.too-deep': 'error',
  'document.circular': 'error',
  'document.unreadable-node': 'error',
  'value.unknown-property': 'warning',
  'name.forbidden-character': 'error',
  'name.reserved-prefix': 'error',
  'name.empty': 'warning',
  'token.type.missing': 'error',
  'token.type.invalid': 'error',
  'token.type.not-string': 'error',
  'token.description.not-string': 'error',
  'token.deprecated.invalid': 'error',
  'token.extensions.not-object': 'error',
  'token.extensions.key-not-namespaced': 'warning',
  'token.property.unknown': 'warning',
  'token.property.not-allowed': 'error',
  'group.description.not-string': 'error',
  'group.type.invalid': 'error',
  'group.type.not-string': 'error',
  'group.deprecated.invalid': 'error',
  'group.extensions.not-object': 'error',
  'group.extensions.key-not-namespaced': 'warning',
  'group.extends.invalid': 'error',
  'group.ref.invalid': 'error',
  'group.property.unknown': 'warning',
  'group.member.invalid': 'error',
  'group.root.not-token': 'error',
  'group.name.case-collision': 'warning',
  'alias.syntax.invalid': 'error',
  'alias.target.missing': 'error',
  'alias.target.not-token': 'error',
  'alias.cycle': 'error',
  'alias.type.mismatch': 'error',
  'ref.not-local': 'error',
  'ref.syntax.invalid': 'error',
  'ref.target.missing': 'error',
  'ref.cycle': 'error',
  'ref.type.mismatch': 'error',
  'extends.target.missing': 'error',
  'extends.target.not-group': 'error',
  'extends.cycle': 'error',
  'extends.inherited-token.invalid': 'error',
  'composite.property.missing': 'error',
  'composite.value.not-object': 'error',
  'stroke-style.value.invalid': 'error',
  'stroke-style.keyword.invalid': 'error',
  'stroke-style.dash-array.not-array': 'error',
  'stroke-style.line-cap.invalid': 'error',
  'shadow.value.invalid': 'error',
  'shadow.item.invalid': 'error',
  'shadow.inset.not-boolean': 'error',
  'gradient.value.not-array': 'error',
  'gradient.stop.invalid': 'error',
  'gradient.position.out-of-range': 'warning',
  'color.value.not-object': 'error',
  'color.color-space.missing': 'error',
  'color.color-space.invalid': 'error',
  'color.components.missing': 'error',
  'color.components.not-array': 'error',
  'color.components.wrong-length': 'error',
  'color.component.invalid': 'error',
  'color.component.out-of-range': 'error',
  'color.alpha.not-number': 'error',
  'color.alpha.out-of-range': 'error',
  'color.hex.invalid': 'error',
  'color.hex.mismatch': 'warning',
  'dimension.value.not-object': 'error',
  'dimension.value.missing': 'error',
  'dimension.value.not-number': 'error',
  'dimension.unit.missing': 'error',
  'dimension.unit.invalid': 'error',
  'font-family.value.invalid': 'error',
  'font-family.name.not-string': 'error',
  'font-weight.value.invalid': 'error',
  'font-weight.number.out-of-range': 'error',
  'font-weight.keyword.invalid': 'error',
  'duration.value.not-object': 'error',
  'duration.value.missing': 'error',
  'duration.value.not-number': 'error',
  'duration.unit.missing': 'error',
  'duration.unit.invalid': 'error',
  'cubic-bezier.value.not-array': 'error',
  'cubic-bezier.value.wrong-length': 'error',
  'cubic-bezier.point.not-number': 'error',
  'cubic-bezier.x.out-of-range': 'error',
  'number.value.not-number': 'error',
};

export const ISSUE_CODES = Object.keys(MESSAGES) as IssueCode[];
