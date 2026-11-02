import type { Severity } from '../../../core/issue.js';
import { fmt } from '../../../core/issue.js';
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

type Meta = Record<string, unknown>;

function range(m: Meta): string {
  const min = m.min === undefined ? '-∞' : String(m.min);
  const max = m.max === undefined ? '∞' : String(m.max);
  return `[${min}, ${max}${m.maxExclusive ? ')' : ']'}`;
}

function list(values: unknown): string {
  return Array.isArray(values) ? values.map((v) => fmt(v)).join(', ') : fmt(values);
}

function suggest(m: Meta): string {
  return m.suggestion === undefined
    ? ''
    : ` Did you mean ${fmt(m.suggestion)}? Values are case-sensitive.`;
}

/** Message catalog (English). Values come from `meta` and are always passed through `fmt`. */
export const MESSAGES: Record<IssueCode, (meta: Meta) => string> = {
  'document.not-object': (m) =>
    `The document root must be a JSON object, received ${fmt(m.actualType)}.`,
  'document.invalid-json': (m) => `The input is not valid JSON: ${fmt(m.reason)}.`,
  'document.too-deep': () =>
    `The document nests groups deeper than the supported limit of ${MAX_DEPTH} levels.`,
  'document.circular': () =>
    'The input object contains a circular reference and cannot be validated.',
  'document.unreadable-node': (m) =>
    `A property could not be read while validating: ${fmt(m.reason)}.`,

  'value.unknown-property': (m) =>
    `Property ${fmt(m.property)} is not defined for this value type. Known properties: ${list(m.known)}.`,

  'name.forbidden-character': (m) =>
    `Name ${fmt(m.name)} contains ${fmt(m.character)}, which is not allowed in token or group names (reserved for alias syntax).`,
  'name.empty': () => 'Token and group names should not be empty.',

  'token.type.missing': () =>
    'The token has no $type and none can be inherited from a parent group, so its type cannot be determined.',
  'token.type.invalid': (m) =>
    `Unknown $type ${fmt(m.actual)}. Allowed: ${list(m.allowed)}.${suggest(m)}`,
  'token.type.not-string': (m) => `$type must be a string, received ${fmt(m.actualType)}.`,
  'token.description.not-string': (m) =>
    `$description must be a plain string, received ${fmt(m.actualType)}.`,
  'token.deprecated.invalid': (m) =>
    `$deprecated must be true, false, or a string explanation, received ${fmt(m.actualType)}.`,
  'token.extensions.not-object': (m) =>
    `$extensions must be an object, received ${fmt(m.actualType)}.`,
  'token.extensions.key-not-namespaced': (m) =>
    `$extensions key ${fmt(m.key)} should use reverse domain name notation (for example "com.example.tool") to avoid clashes.`,
  'token.property.unknown': (m) =>
    `Property ${fmt(m.property)} is not defined for tokens by this specification version and will be ignored.`,
  'token.property.not-allowed': (m) =>
    `Property ${fmt(m.property)} is not allowed on a token: an object with $value cannot also contain child tokens or groups.`,

  'group.description.not-string': (m) =>
    `$description must be a plain string, received ${fmt(m.actualType)}.`,
  'group.type.invalid': (m) =>
    `Unknown group $type ${fmt(m.actual)}. Allowed: ${list(m.allowed)}.${suggest(m)}`,
  'group.type.not-string': (m) => `$type must be a string, received ${fmt(m.actualType)}.`,
  'group.deprecated.invalid': (m) =>
    `$deprecated must be true, false, or a string explanation, received ${fmt(m.actualType)}.`,
  'group.extensions.not-object': (m) =>
    `$extensions must be an object, received ${fmt(m.actualType)}.`,
  'group.extensions.key-not-namespaced': (m) =>
    `$extensions key ${fmt(m.key)} should use reverse domain name notation (for example "com.example.tool") to avoid clashes.`,
  'group.extends.invalid': (m) =>
    `$extends must be a group reference such as "{group.name}", received ${fmt(m.actual)}.`,
  'group.ref.invalid': (m) =>
    `$ref on a group must be a local JSON pointer such as "#/group/name", received ${fmt(m.actual)}.`,
  'group.property.unknown': (m) =>
    `Property ${fmt(m.property)} is not defined for groups by this specification version. Names must not start with "$".`,
  'group.member.invalid': (m) =>
    `Member ${fmt(m.name)} must be a token or a group (an object), received ${fmt(m.actualType)}.`,
  'group.root.not-token': () =>
    'The reserved "$root" member must be a token (an object with $value).',
  'group.name.case-collision': (m) =>
    `Names ${list(m.names)} differ only by case; tools that transform names may produce duplicates.`,

  'alias.syntax.invalid': (m) =>
    `Alias ${fmt(m.actual)} is malformed. Use "{group.token}" with non-empty, dot-separated names.`,
  'alias.target.missing': (m) =>
    `Alias ${fmt(m.alias)} does not resolve: no token at ${fmt(m.path)}.`,
  'alias.target.not-token': (m) =>
    `Alias ${fmt(m.alias)} points at a group, not a token. Curly-brace aliases can only target tokens (use "{${String(m.path ?? '')}.$root}" for a group's root token).`,
  'alias.cycle': (m) =>
    `Circular alias chain: ${list(m.chain)}. The value of every token in the chain is unknown.`,
  'alias.type.mismatch': (m) =>
    `Alias ${fmt(m.alias)} resolves to a ${fmt(m.actual)} token but this token is declared as ${fmt(m.expected)}.`,

  'ref.not-local': (m) =>
    `$ref ${fmt(m.actual)} must point inside this document and start with "#/". External and remote references are not supported.`,
  'ref.syntax.invalid': (m) => `$ref ${fmt(m.actual)} is not a valid JSON pointer (RFC 6901).`,
  'ref.target.missing': (m) =>
    `$ref ${fmt(m.actual)} does not resolve: nothing exists at that location.`,
  'ref.cycle': (m) => `Circular reference chain: ${list(m.chain)}.`,
  'ref.type.mismatch': (m) =>
    `$ref ${fmt(m.actual)} resolves to a ${fmt(m.actualType)} token but this token is declared as ${fmt(m.expected)}.`,

  'extends.target.missing': (m) =>
    `$extends ${fmt(m.actual)} does not resolve: no group at ${fmt(m.path)}.`,
  'extends.target.not-group': (m) =>
    `$extends ${fmt(m.actual)} must reference a group, but ${fmt(m.path)} is a token.`,
  'extends.cycle': (m) =>
    `Circular group extension: ${list(m.chain)}. A group cannot extend itself, an ancestor, or a group that extends it.`,
  'extends.inherited-token.invalid': (m) =>
    `Token ${fmt(m.token)} inherited from ${fmt(m.inheritedFrom)} is invalid in this group: ${fmt(m.reason)}.`,

  'composite.property.missing': (m) =>
    `A ${fmt(m.type)} value must have a ${fmt(m.property)} property (${fmt(m.expectedType)} value or reference).`,
  'composite.value.not-object': (m) =>
    `A ${fmt(m.type)} value must be an object with ${list(m.properties)}, received ${fmt(m.actualType)}.`,
  'stroke-style.value.invalid': (m) =>
    `A strokeStyle value must be a keyword string or an object with "dashArray" and "lineCap", received ${fmt(m.actualType)}.`,
  'stroke-style.keyword.invalid': (m) =>
    `Unknown stroke style ${fmt(m.actual)}. Allowed: ${list(m.allowed)}.${suggest(m)}`,
  'stroke-style.dash-array.not-array': (m) =>
    `"dashArray" must be an array of dimension values or references, received ${fmt(m.actualType)}.`,
  'stroke-style.line-cap.invalid': (m) =>
    `"lineCap" must be one of ${list(m.allowed)}, received ${fmt(m.actual)}.${suggest(m)}`,
  'shadow.value.invalid': (m) =>
    `A shadow value must be a shadow object or an array of shadow objects and references, received ${fmt(m.actualType)}.`,
  'shadow.item.invalid': (m) =>
    `Shadow entry ${fmt(m.index)} must be a shadow object or a reference to a shadow token, received ${fmt(m.actualType)}.`,
  'shadow.inset.not-boolean': (m) =>
    `"inset" must be true or false, received ${fmt(m.actualType)}.`,
  'gradient.value.not-array': (m) =>
    `A gradient value must be an array of gradient stops and references, received ${fmt(m.actualType)}.`,
  'gradient.stop.invalid': (m) =>
    `Gradient entry ${fmt(m.index)} must be a stop object with "color" and "position" or a reference to a gradient token, received ${fmt(m.actualType)}.`,
  'gradient.position.out-of-range': (m) =>
    `Gradient stop position ${fmt(m.actual)} is outside [0, 1] and will be clamped by consumers.`,

  'color.value.not-object': (m) =>
    `A color value must be an object with "colorSpace" and "components", received ${fmt(m.actualType)}.`,
  'color.color-space.missing': () => 'A color value must have a "colorSpace" property.',
  'color.color-space.invalid': (m) =>
    `Unsupported color space ${fmt(m.actual)}. Supported: ${list(m.allowed)}.${suggest(m)}`,
  'color.components.missing': () => 'A color value must have a "components" array.',
  'color.components.not-array': (m) =>
    `"components" must be an array, received ${fmt(m.actualType)}.`,
  'color.components.wrong-length': (m) =>
    `"components" must have exactly ${fmt(m.expected)} entries for ${fmt(m.colorSpace)}, received ${fmt(m.actual)}.`,
  'color.component.invalid': (m) =>
    `Color component ${fmt(m.index)} must be a number or "none", received ${fmt(m.actual)}.`,
  'color.component.out-of-range': (m) =>
    `Color component ${fmt(m.index)} (${fmt(m.name)}) of ${fmt(m.colorSpace)} must be in ${range(m)}, received ${fmt(m.actual)}.`,
  'color.alpha.not-number': (m) => `"alpha" must be a number, received ${fmt(m.actualType)}.`,
  'color.alpha.out-of-range': (m) => `"alpha" must be in [0, 1], received ${fmt(m.actual)}.`,
  'color.hex.invalid': (m) =>
    `"hex" must be a 6-digit CSS hex color such as "#ff00ff", received ${fmt(m.actual)}.`,
  'color.hex.mismatch': (m) =>
    `"hex" ${fmt(m.hex)} does not match the sRGB components (expected ${fmt(m.expected)}).`,

  'dimension.value.not-object': (m) =>
    `A dimension value must be an object with "value" and "unit", received ${fmt(m.actualType)}.`,
  'dimension.value.missing': () => 'A dimension value must have a "value" property.',
  'dimension.value.not-number': (m) =>
    `Dimension "value" must be a number, received ${fmt(m.actualType)}.`,
  'dimension.unit.missing': () =>
    'A dimension value must have a "unit" property, even when "value" is 0.',
  'dimension.unit.invalid': (m) =>
    `Dimension "unit" must be one of ${list(m.allowed)}, received ${fmt(m.actual)}.${suggest(m)}`,

  'font-family.value.invalid': (m) =>
    `A font family value must be a string or an array of strings, received ${fmt(m.actualType)}.`,
  'font-family.name.not-string': (m) =>
    `Font family entry ${fmt(m.index)} must be a string, received ${fmt(m.actualType)}.`,

  'font-weight.value.invalid': (m) =>
    `A font weight value must be a number in [1, 1000] or a keyword, received ${fmt(m.actualType)}.`,
  'font-weight.number.out-of-range': (m) =>
    `Font weight must be in [1, 1000], received ${fmt(m.actual)}.`,
  'font-weight.keyword.invalid': (m) =>
    `Unknown font weight keyword ${fmt(m.actual)}. Allowed: ${list(m.allowed)}.${suggest(m)}`,

  'duration.value.not-object': (m) =>
    `A duration value must be an object with "value" and "unit", received ${fmt(m.actualType)}.`,
  'duration.value.missing': () => 'A duration value must have a "value" property.',
  'duration.value.not-number': (m) =>
    `Duration "value" must be a number, received ${fmt(m.actualType)}.`,
  'duration.unit.missing': () => 'A duration value must have a "unit" property.',
  'duration.unit.invalid': (m) =>
    `Duration "unit" must be one of ${list(m.allowed)}, received ${fmt(m.actual)}.${suggest(m)}`,

  'cubic-bezier.value.not-array': (m) =>
    `A cubic Bézier value must be an array of four numbers, received ${fmt(m.actualType)}.`,
  'cubic-bezier.value.wrong-length': (m) =>
    `A cubic Bézier value must have exactly 4 numbers [P1x, P1y, P2x, P2y], received ${fmt(m.actual)}.`,
  'cubic-bezier.point.not-number': (m) =>
    `Cubic Bézier coordinate ${fmt(m.index)} must be a number, received ${fmt(m.actualType)}.`,
  'cubic-bezier.x.out-of-range': (m) =>
    `Cubic Bézier x coordinate ${fmt(m.index)} must be in [0, 1], received ${fmt(m.actual)}.`,

  'number.value.not-number': (m) =>
    `A number value must be a JSON number, received ${fmt(m.actualType)}.`,
};

export const DEFAULT_SEVERITY: Record<IssueCode, Severity> = {
  'document.not-object': 'error',
  'document.invalid-json': 'error',
  'document.too-deep': 'error',
  'document.circular': 'error',
  'document.unreadable-node': 'error',
  'value.unknown-property': 'warning',
  'name.forbidden-character': 'error',
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
