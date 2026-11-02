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
