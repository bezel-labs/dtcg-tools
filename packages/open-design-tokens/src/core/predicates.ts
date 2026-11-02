/** `true` for non-null objects that are not arrays (what JSON calls an object). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Own-property check that never consults the prototype chain. */
export function hasOwn(obj: object, key: string): boolean {
  return Object.hasOwn(obj, key);
}

/** A DTCG token is an object with an own `$value` property. */
export function isToken(value: unknown): value is Record<string, unknown> & { $value: unknown } {
  return isPlainObject(value) && hasOwn(value, '$value');
}

/** A DTCG group is an object without `$value`. */
export function isGroup(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) && !hasOwn(value, '$value');
}

/**
 * Alias-shaped string: starts with `{` and ends with `}`. Anything of this shape
 * is treated as an alias attempt and its grammar is checked separately, so a
 * malformed alias is reported as such rather than as a plain string value.
 */
const ALIAS_RE = /^\{[\s\S]*\}$/;

export function isAlias(value: unknown): value is `{${string}}` {
  return typeof value === 'string' && ALIAS_RE.test(value);
}

/** Reference syntax: `{ "$ref": "#/group/token/$value" }`. */
export function isReference(value: unknown): value is { $ref: string } {
  return isPlainObject(value) && hasOwn(value, '$ref') && typeof value.$ref === 'string';
}

export function isAliasOrReference(value: unknown): boolean {
  return isAlias(value) || isReference(value);
}
