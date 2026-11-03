import type { ValidationIssue } from '../../../../core/issue.js';
import { parseJsonPointer, toJsonPointer } from '../../../../core/path.js';
import {
  hasOwn,
  isAlias,
  isPlainObject,
  isReference,
  isToken,
} from '../../../../core/predicates.js';
import type { NodeInfo, PreparedDocument } from '../../../../core/prepare.js';
import { TOKEN_TYPES } from '../constants.js';
import type { TokenType } from '../types/token.js';
import { dereference as dereferenceValue } from './dereference.js';
import { parseAlias, parseRef } from './parse.js';

export type Status =
  | 'ok'
  | 'missing'
  | 'not-token'
  | 'not-group'
  | 'malformed'
  | 'not-local'
  | 'cycle';

export interface PathLookup {
  /** The raw object or value found at the path. */
  value: unknown;
  /** Index entry when the path lands on an indexed token/group/reference. */
  node: NodeInfo | undefined;
  /** Pointer of the indexed node that defines the value (the origin after `$extends`). */
  originPointer: string;
}

export interface MergedMember {
  value: unknown;
  originPointer: string;
}

export interface MergedGroup {
  /** Merged members (tokens and sub-groups) keyed by name, locals winning. */
  members: Map<string, MergedMember>;
  /** Effective `$type` after extension resolution. */
  type: TokenType | undefined;
  /** Status of the `$extends` / `$ref` resolution on this group. */
  extendsStatus: Status | 'none';
  extendsTargetPointer?: string;
}

export interface ExtendsTarget {
  status: Status;
  pointer: string;
  raw?: Record<string, unknown>;
  actual: unknown;
}

export interface AliasResolution {
  status: Status;
  /** Final concrete token after following the chain. */
  target?: NodeInfo;
  /** Number of alias hops from the start token to the end of the chain. */
  hops: number;
  /** Pointers visited, starting with the alias token (abbreviated when a cached tail was reused). */
  chain: string[];
  /** Resolved target path pointer for diagnostics (even when missing). */
  path: string;
}

export interface RefResolution {
  status: Status;
  value?: unknown;
  /** Owning token when the pointer lands on or inside a token. */
  tokenNode?: NodeInfo | undefined;
  chain: string[];
}

export interface OwningToken {
  node: NodeInfo;
  /** True when the pointer goes below the token (e.g. `.../$value/components/0`). */
  fragment: boolean;
}

/**
 * Resolves aliases, `$ref` pointers, `$extends` merges, and effective types for
 * one prepared document. Create one per document with {@link createResolver}.
 * Every result is memoised, so chains cost linear time and cycles are detected
 * rather than followed.
 */
export interface Resolver {
  /** Index entry at a JSON pointer. */
  node(pointer: string): NodeInfo | undefined;
  /** Raw RFC 6901 traversal; own properties only, integer array indices only. */
  rawAt(segments: readonly string[]): unknown;
  /** Looks a token path up through merged group views (so inherited tokens are found). */
  lookupPath(segments: readonly string[]): PathLookup | undefined;
  /** Merged view of a group (memoised). `pointer` identifies the group; `raw` is its object. */
  mergedGroup(pointer: string, raw: Record<string, unknown>): MergedGroup;
  /** Resolves a group's `$extends` (alias syntax) or `$ref` (JSON pointer) to its target group. */
  extendsTarget(raw: Record<string, unknown>): ExtendsTarget | undefined;
  /** Effective type of an indexed token or group after inheritance and extension (memoised). */
  effectiveType(node: NodeInfo): TokenType | undefined;
  /** Follows an alias/`$ref` token to the concrete token at the end of the chain. */
  resolveAlias(start: string): AliasResolution;
  /** Finds the indexed token a pointer lands on or inside. */
  owningToken(segments: readonly string[]): OwningToken | undefined;
  /** Resolves a `$ref` string to its raw value, following whole-token references. */
  resolveRef(ref: string, fromPointer: string): RefResolution;
  /**
   * Replaces every nested `{ $ref }` inside `value` with the referenced fragment
   * (§7.3). `fromPointer` is the token the value belongs to; issues are reported
   * under its `$value`. `failed` is true when at least one reference did not resolve.
   */
  dereference(value: unknown, fromPointer: string): Dereferenced;
}

export interface Dereferenced {
  /** The value with every nested `{ $ref }` replaced by its target. */
  value: unknown;
  issues: ValidationIssue[];
  /** True when at least one reference failed; the value should then not be validated further. */
  failed: boolean;
}

function isKnownType(t: unknown): t is TokenType {
  return typeof t === 'string' && (TOKEN_TYPES as readonly string[]).includes(t);
}

function escapeSegment(seg: string): string {
  return seg.replace(/~/g, '~0').replace(/\//g, '~1');
}

function isAncestorOrSelf(ancestor: string, pointer: string): boolean {
  return pointer === ancestor || pointer.startsWith(`${ancestor}/`) || ancestor === '';
}

/** Raw RFC 6901 traversal over a parsed document; own properties only, integer array indices only. */
export function rawAt(root: unknown, segments: readonly string[]): unknown {
  let cur: unknown = root;
  for (const seg of segments) {
    if (Array.isArray(cur)) {
      if (!/^(0|[1-9][0-9]*)$/.test(seg)) return undefined;
      const i = Number(seg);
      if (i >= cur.length) return undefined;
      cur = cur[i];
    } else if (isPlainObject(cur) && hasOwn(cur, seg)) {
      try {
        cur = cur[seg];
      } catch {
        return undefined;
      }
    } else {
      return undefined;
    }
  }
  return cur;
}

type Step =
  | { kind: 'concrete' }
  | { kind: 'next'; next: NodeInfo }
  | { kind: 'error'; status: Status; path: string };

/**
 * Creates a resolver for one prepared document. The memo tables live in this
 * closure and are never shared between documents.
 */
export function createResolver(doc: PreparedDocument): Resolver {
  const merged = new Map<string, MergedGroup>();
  const merging = new Set<string>();
  const aliases = new Map<string, AliasResolution>();
  const types = new Map<string, TokenType | undefined>();
  /** Nested groups that inherit a same-named group from an extended base (deep merge, §6.4.3). */
  const implicitBase = new Map<string, { pointer: string; raw: Record<string, unknown> }>();

  const node = (pointer: string): NodeInfo | undefined => doc.index.get(pointer);

  const extendsTarget = (raw: Record<string, unknown>): ExtendsTarget | undefined => {
    let segments: string[] | undefined;
    let actual: unknown;
    if (hasOwn(raw, '$extends')) {
      actual = raw.$extends;
      if (typeof actual !== 'string' || !isAlias(actual))
        return { status: 'malformed', pointer: '', actual };
      segments = parseAlias(actual);
      if (!segments) return { status: 'malformed', pointer: '', actual };
    } else if (hasOwn(raw, '$ref')) {
      actual = raw.$ref;
      if (typeof actual !== 'string') return { status: 'malformed', pointer: '', actual };
      const parsed = parseRef(actual);
      if (!parsed.ok)
        return {
          status: parsed.reason === 'not-local' ? 'not-local' : 'malformed',
          pointer: '',
          actual,
        };
      segments = parsed.segments;
    } else {
      return undefined;
    }
    const pointer = toJsonPointer(segments);
    const found = rawAt(doc.root, segments);
    if (found === undefined) return { status: 'missing', pointer, actual };
    if (!isPlainObject(found) || isToken(found)) return { status: 'not-group', pointer, actual };
    return { status: 'ok', pointer, raw: found, actual };
  };

  const mergedGroup = (pointer: string, raw: Record<string, unknown>): MergedGroup => {
    const cached = merged.get(pointer);
    if (cached) return cached;
    const own: MergedGroup = {
      members: new Map(),
      type: isKnownType(raw.$type) ? raw.$type : undefined,
      extendsStatus: 'none',
    };
    if (merging.has(pointer)) {
      own.extendsStatus = 'cycle';
      return own;
    }
    merging.add(pointer);

    // Inherited content first: an explicit $extends/$ref, else a same-named
    // group inherited through the parent's extension.
    const target = extendsTarget(raw);
    const implicit = target ? undefined : implicitBase.get(pointer);
    if (implicit && !merging.has(implicit.pointer)) {
      const base = mergedGroup(implicit.pointer, implicit.raw);
      for (const [k, v] of base.members) own.members.set(k, v);
      if (own.type === undefined) own.type = base.type;
    }
    if (target) {
      own.extendsStatus = target.status;
      own.extendsTargetPointer = target.pointer;
      if (target.status === 'ok' && target.raw) {
        if (isAncestorOrSelf(target.pointer, pointer) || merging.has(target.pointer)) {
          own.extendsStatus = 'cycle';
        } else {
          const base = mergedGroup(target.pointer, target.raw);
          if (base.extendsStatus === 'cycle') own.extendsStatus = 'cycle';
          for (const [k, v] of base.members) own.members.set(k, v);
          if (own.type === undefined) own.type = base.type;
        }
      }
    }
    // Local members override wholesale (tokens) or merge (groups).
    for (const key of Object.keys(raw)) {
      if (key.startsWith('$') && key !== '$root') continue;
      let value: unknown;
      try {
        value = raw[key];
      } catch {
        continue;
      }
      const childPointer = `${pointer}/${escapeSegment(key)}`;
      const inherited = own.members.get(key);
      if (
        inherited &&
        isPlainObject(inherited.value) &&
        !isToken(inherited.value) &&
        isPlainObject(value) &&
        !isToken(value)
      ) {
        // Nested group at the same path: deep merge. The local group's merged
        // view will pull in the inherited group's members.
        implicitBase.set(childPointer, { pointer: inherited.originPointer, raw: inherited.value });
      }
      own.members.set(key, { value, originPointer: childPointer });
    }
    merging.delete(pointer);
    merged.set(pointer, own);
    return own;
  };

  const lookupPath = (segments: readonly string[]): PathLookup | undefined => {
    let originPointer = '';
    let value: unknown = doc.root;
    for (const seg of segments) {
      if (!isPlainObject(value) || isToken(value)) return undefined;
      const member = mergedGroup(originPointer, value).members.get(seg);
      if (!member) return undefined;
      value = member.value;
      originPointer = member.originPointer;
    }
    return { value, node: doc.index.get(originPointer), originPointer };
  };

  const effectiveType = (n: NodeInfo): TokenType | undefined => {
    if (types.has(n.pointer)) return types.get(n.pointer);
    let type: TokenType | undefined = isKnownType(n.ownType) ? n.ownType : undefined;
    if (type === undefined && n.kind === 'group') type = mergedGroup(n.pointer, n.raw).type;
    if (type === undefined && n.parentPointer !== undefined) {
      const parent = doc.index.get(n.parentPointer);
      if (parent) type = effectiveType(parent);
    }
    types.set(n.pointer, type);
    return type;
  };

  const owningToken = (segments: readonly string[]): OwningToken | undefined => {
    if (rawAt(doc.root, segments) === undefined) {
      // `#/x/$value` where x is a reference node (it has $ref, not $value): the whole token.
      const last = segments[segments.length - 1];
      const owner =
        last === '$value' ? doc.index.get(toJsonPointer(segments.slice(0, -1))) : undefined;
      if (owner?.kind === 'reference') return { node: owner, fragment: false };
      return undefined;
    }
    for (let i = segments.length; i >= 0; i -= 1) {
      const found = doc.index.get(toJsonPointer(segments.slice(0, i)));
      if (found) {
        if (found.kind === 'group') return undefined;
        // `#/a/b` and `#/a/b/$value` both mean the whole token value.
        const rest = segments.slice(i);
        const whole = rest.length === 0 || (rest.length === 1 && rest[0] === '$value');
        return { node: found, fragment: !whole };
      }
    }
    return undefined;
  };

  /** One hop: where does this token's `$value` (or `$ref`) point? */
  const step = (n: NodeInfo): Step => {
    const raw = n.raw;
    let ref: unknown;
    if (n.kind === 'reference') ref = raw.$ref;
    else if (n.kind === 'token') ref = raw.$value;
    else return { kind: 'error', status: 'not-token', path: n.pointer };

    if (typeof ref === 'string' && isAlias(ref)) {
      const segments = parseAlias(ref);
      if (!segments) return { kind: 'error', status: 'malformed', path: n.pointer };
      const found = lookupPath(segments);
      const path = toJsonPointer(segments);
      if (!found) return { kind: 'error', status: 'missing', path };
      if (!isToken(found.value)) return { kind: 'error', status: 'not-token', path };
      const next = found.node ?? doc.index.get(found.originPointer);
      if (!next) return { kind: 'error', status: 'missing', path };
      return { kind: 'next', next };
    }
    const refString: string | undefined =
      n.kind === 'reference'
        ? typeof ref === 'string'
          ? ref
          : undefined
        : isReference(ref)
          ? ref.$ref
          : undefined;
    if (refString !== undefined) {
      const parsed = parseRef(refString);
      if (!parsed.ok) {
        return {
          kind: 'error',
          status: parsed.reason === 'not-local' ? 'not-local' : 'malformed',
          path: n.pointer,
        };
      }
      const owner = owningToken(parsed.segments);
      if (!owner) return { kind: 'error', status: 'missing', path: toJsonPointer(parsed.segments) };
      if (owner.fragment) return { kind: 'concrete' }; // a sub-value: validated by the consumer
      return { kind: 'next', next: owner.node };
    }
    return { kind: 'concrete' };
  };

  const resolveAlias = (start: string): AliasResolution => {
    const cached = aliases.get(start);
    if (cached) return cached;
    const chain: string[] = [];
    const seen = new Set<string>();
    let current = doc.index.get(start);
    let result: AliasResolution | undefined;
    while (current) {
      if (seen.has(current.pointer)) {
        const from = chain.indexOf(current.pointer);
        result = {
          status: 'cycle',
          hops: chain.length,
          chain: chain.slice(from),
          path: current.pointer,
        };
        break;
      }
      const known = aliases.get(current.pointer);
      if (known && current.pointer !== start) {
        // Reuse the cached result. The chain only serves diagnostics, so record the
        // hops walked here plus the endpoint instead of copying the cached chain,
        // which would make long chains quadratic in time and memory.
        result =
          known.status === 'cycle'
            ? known
            : {
                ...known,
                hops: chain.length + known.hops,
                chain: [...chain, known.target?.pointer ?? known.path],
              };
        break;
      }
      seen.add(current.pointer);
      chain.push(current.pointer);
      const s = step(current);
      if (s.kind === 'concrete') {
        result = {
          status: 'ok',
          target: current,
          hops: chain.length - 1,
          chain,
          path: current.pointer,
        };
        break;
      }
      if (s.kind === 'error') {
        result = { status: s.status, hops: chain.length, chain, path: s.path };
        break;
      }
      current = s.next;
    }
    result ??= { status: 'missing', hops: chain.length, chain, path: start };
    // Memoise every node walked so long chains stay linear. All of them share
    // one result object (the chain is only used for cycle diagnostics).
    for (const p of chain) if (!aliases.has(p)) aliases.set(p, result);
    return result;
  };

  const resolveRef = (ref: string, fromPointer: string): RefResolution => {
    const parsed = parseRef(ref);
    if (!parsed.ok)
      return {
        status: parsed.reason === 'not-local' ? 'not-local' : 'malformed',
        chain: [fromPointer],
      };
    const value = rawAt(doc.root, parsed.segments);
    if (value === undefined) return { status: 'missing', chain: [fromPointer] };
    const owner = owningToken(parsed.segments);
    if (owner && !owner.fragment) {
      const res = resolveAlias(owner.node.pointer);
      if (res.status !== 'ok') return { status: res.status, chain: [fromPointer, ...res.chain] };
      const target = res.target as NodeInfo;
      return {
        status: 'ok',
        value: target.raw.$value,
        tokenNode: target,
        chain: [fromPointer, ...res.chain],
      };
    }
    return { status: 'ok', value, tokenNode: owner?.node, chain: [fromPointer] };
  };

  const self: Resolver = Object.freeze({
    node,
    rawAt: (segments: readonly string[]) => rawAt(doc.root, segments),
    lookupPath,
    mergedGroup,
    extendsTarget,
    effectiveType,
    resolveAlias,
    owningToken,
    resolveRef,
    dereference: (value: unknown, fromPointer: string) => {
      const path = parseJsonPointer(fromPointer) ?? [];
      return dereferenceValue(
        value,
        { spec: doc.spec, path: [...path, '$value'] },
        self,
        fromPointer,
      );
    },
  });
  return self;
}
