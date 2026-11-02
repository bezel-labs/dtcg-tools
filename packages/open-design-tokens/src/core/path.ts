import type { IssuePath } from './issue.js';

/** Encodes one JSON pointer segment (RFC 6901 §3). */
export function escapePointerSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

/** Decodes one JSON pointer segment (RFC 6901 §4). */
export function unescapePointerSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

/** Builds a JSON pointer from path segments. The root is the empty string. */
export function toJsonPointer(segments: readonly string[]): string {
  return segments.map((s) => `/${escapePointerSegment(s)}`).join('');
}

/**
 * Parses a JSON pointer into segments. Returns `undefined` for a malformed
 * pointer (one that is non-empty and does not start with `/`).
 */
export function parseJsonPointer(pointer: string): string[] | undefined {
  if (pointer === '') return [];
  if (!pointer.startsWith('/')) return undefined;
  return pointer.slice(1).split('/').map(unescapePointerSegment);
}

/** Builds a dotted path. Segments containing `.` are left as-is; the pointer is the canonical form. */
export function toDotPath(segments: readonly string[]): string {
  return segments.join('.');
}

export function toIssuePath(segments: readonly string[]): IssuePath {
  return { pointer: toJsonPointer(segments), dot: toDotPath(segments) };
}
