import type { ValidationIssue } from '../../../../core/issue.js';
import { isPlainObject, isReference } from '../../../../core/predicates.js';
import type { ValidationContext } from '../../../context.js';
import { child, createIssue } from '../../../context.js';
import type { IssueCode } from '../messages.js';
import type { Dereferenced, Resolver, Status } from './resolver.js';

export type { Dereferenced } from './resolver.js';

/** Guards against pathological nesting inside a single value. */
const MAX_VALUE_DEPTH = 64;

function codeFor(status: Status): IssueCode {
  switch (status) {
    case 'not-local':
      return 'ref.not-local';
    case 'malformed':
      return 'ref.syntax.invalid';
    case 'cycle':
      return 'ref.cycle';
    default:
      return 'ref.target.missing';
  }
}

/**
 * Replaces property-level references (§7.3) inside a value with the referenced
 * fragments so validators only ever see concrete values and curly aliases. The
 * top-level value itself is left alone: a whole-value `$ref` is an alias and is
 * handled by the alias validator. Issues are reported at the referencing path.
 */
export function dereference(
  value: unknown,
  ctx: ValidationContext,
  resolver: Resolver,
  fromPointer: string,
): Dereferenced {
  const issues: ValidationIssue[] = [];
  let failed = false;

  const walk = (
    v: unknown,
    c: ValidationContext,
    visiting: Set<string>,
    depth: number,
  ): unknown => {
    if (depth > MAX_VALUE_DEPTH) return v;
    if (isReference(v)) {
      const key = v.$ref;
      if (visiting.has(key)) {
        issues.push(createIssue(c, 'ref.cycle', { chain: [...visiting, key] }));
        failed = true;
        return undefined;
      }
      const res = resolver.resolveRef(key, fromPointer);
      if (res.status !== 'ok') {
        issues.push(createIssue(c, codeFor(res.status), { actual: key, chain: res.chain }));
        failed = true;
        return undefined;
      }
      const next = new Set(visiting);
      next.add(key);
      return walk(res.value, c, next, depth + 1);
    }
    if (Array.isArray(v)) {
      return v.map((item, i) => walk(item, child(c, String(i)), visiting, depth + 1));
    }
    if (isPlainObject(v)) {
      const out: Record<string, unknown> = Object.create(null);
      for (const k of Object.keys(v)) out[k] = walk(v[k], child(c, k), visiting, depth + 1);
      return out;
    }
    return v;
  };

  // Only nested references are replaced; the top level is passed through.
  let out: unknown = value;
  if (Array.isArray(value)) {
    out = value.map((item, i) => walk(item, child(ctx, String(i)), new Set(), 1));
  } else if (isPlainObject(value) && !isReference(value)) {
    const o: Record<string, unknown> = Object.create(null);
    for (const k of Object.keys(value)) o[k] = walk(value[k], child(ctx, k), new Set(), 1);
    out = o;
  }
  return { value: out, issues, failed };
}
