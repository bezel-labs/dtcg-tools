import { parseJsonPointer } from '../../../../core/path.js';

/** Anchored alias grammar: `{seg(.seg)*}` with non-empty segments that contain no braces or dots. */
const ALIAS_RE = /^\{([^{}.]+(?:\.[^{}.]+)*)\}$/;

/** Splits `{a.b.c}` into `['a', 'b', 'c']`, or `undefined` when malformed. */
export function parseAlias(alias: string): string[] | undefined {
  const m = ALIAS_RE.exec(alias);
  return m ? (m[1] as string).split('.') : undefined;
}

export type RefParse =
  | { ok: true; segments: string[] }
  | { ok: false; reason: 'not-local' | 'syntax' };

/**
 * Parses a `$ref`. Only document-local pointers (`#`, `#/...`) are accepted;
 * anything else is refused before any lookup happens.
 */
export function parseRef(ref: string): RefParse {
  if (!ref.startsWith('#')) return { ok: false, reason: 'not-local' };
  const pointer = ref.slice(1);
  const segments = parseJsonPointer(pointer);
  if (segments === undefined) return { ok: false, reason: 'syntax' };
  return { ok: true, segments };
}
