import { MAX_DEPTH } from './limits.js';
import { toJsonPointer } from './path.js';
import { hasOwn, isPlainObject, isToken } from './predicates.js';

export type SpecId = '2025.10';

export interface NodeInfo {
  kind: 'token' | 'group';
  /** Path segments from the root; the root group has `[]`. */
  path: readonly string[];
  pointer: string;
  parentPointer: string | undefined;
  raw: Record<string, unknown>;
  /** Own `$type` when it is a string (validity is checked separately). */
  ownType: string | undefined;
  /** Nearest ancestor group `$type` (string), not including the node itself. */
  inheritedType: string | undefined;
  /**
   * True when this node or an ancestor group declares `$extends`/`$ref`, so
   * properties such as `$type` may still arrive through group extension.
   */
  underExtends: boolean;
  depth: number;
}

export interface PreparedDocument {
  /** Parsed JSON, or the object passed in. */
  root: unknown;
  /** Set when a string input was not valid JSON; `index` is then empty. */
  parseError?: { reason: string };
  /** Every token and group in document order, keyed by JSON pointer. */
  index: Map<string, NodeInfo>;
  /** Structural problems found while indexing (depth, cycles, throwing getters). */
  structuralIssues: StructuralIssue[];
  spec: SpecId;
}

export interface StructuralIssue {
  code: 'document.too-deep' | 'document.circular' | 'document.unreadable-node';
  path: readonly string[];
  meta?: Record<string, unknown>;
}

export interface PrepareOptions {
  spec?: SpecId;
}

const PREPARED = Symbol.for('open-design-tokens.prepared');

export function isPreparedDocument(value: unknown): value is PreparedDocument {
  return typeof value === 'object' && value !== null && PREPARED in value;
}

/**
 * Parses (if needed) and indexes a document once so the validator and linter
 * can share the work. Never throws on input. Containers are `Map`s so hostile
 * names such as `__proto__` are plain data.
 */
export function prepareDocument(input: unknown, options: PrepareOptions = {}): PreparedDocument {
  if (isPreparedDocument(input)) return input;
  const spec = options.spec ?? '2025.10';
  const doc: PreparedDocument = {
    root: input,
    index: new Map(),
    structuralIssues: [],
    spec,
  };
  Object.defineProperty(doc, PREPARED, { value: true, enumerable: false });

  if (typeof input === 'string') {
    try {
      doc.root = JSON.parse(input);
    } catch (err) {
      doc.parseError = { reason: err instanceof Error ? err.message : String(err) };
      return doc;
    }
  }

  if (!isPlainObject(doc.root)) return doc;

  // Iterative walk with an explicit stack; ancestors tracked for cycle detection.
  interface Frame {
    obj: Record<string, unknown>;
    path: string[];
    parentPointer: string | undefined;
    inheritedType: string | undefined;
    underExtends: boolean;
    depth: number;
  }
  /** Pushed after a group's children so the group leaves `ancestors` once they are done. */
  interface Exit {
    exit: object;
  }
  const ancestors = new Set<object>();
  const stack: (Frame | Exit)[] = [
    {
      obj: doc.root,
      path: [],
      parentPointer: undefined,
      inheritedType: undefined,
      underExtends: false,
      depth: 0,
    },
  ];
  // Document order (pre-order, keys in insertion order): children are pushed in reverse.

  while (stack.length > 0) {
    const item = stack.pop() as Frame | Exit;
    if ('exit' in item) {
      ancestors.delete(item.exit);
      continue;
    }
    const frame = item;
    const { obj, path, depth } = frame;

    const pointer = toJsonPointer(path);
    const isTok = isToken(obj);

    if (depth > MAX_DEPTH) {
      doc.structuralIssues.push({ code: 'document.too-deep', path, meta: { depth } });
      continue;
    }
    if (ancestors.has(obj)) {
      doc.structuralIssues.push({ code: 'document.circular', path });
      continue;
    }

    const ownType = hasOwn(obj, '$type') && typeof obj.$type === 'string' ? obj.$type : undefined;
    const underExtends = frame.underExtends || hasOwn(obj, '$extends') || hasOwn(obj, '$ref');
    doc.index.set(pointer, {
      kind: isTok ? 'token' : 'group',
      path,
      pointer,
      parentPointer: frame.parentPointer,
      raw: obj,
      ownType,
      inheritedType: frame.inheritedType,
      underExtends,
      depth,
    });

    if (isTok) continue;

    // Group: descend into object members whose key is not a `$` property,
    // plus the reserved `$root` token.
    ancestors.add(obj);
    stack.push({ exit: obj });
    const childType = ownType ?? frame.inheritedType;
    const keys = Object.keys(obj);
    for (let i = keys.length - 1; i >= 0; i -= 1) {
      const key = keys[i] as string;
      if (key.startsWith('$') && key !== '$root') continue;
      let member: unknown;
      try {
        member = obj[key];
      } catch (err) {
        doc.structuralIssues.push({
          code: 'document.unreadable-node',
          path: [...path, key],
          meta: { reason: err instanceof Error ? err.message : String(err) },
        });
        continue;
      }
      if (!isPlainObject(member)) continue; // reported by the group validator
      stack.push({
        obj: member,
        path: [...path, key],
        parentPointer: pointer,
        inheritedType: childType,
        underExtends,
        depth: depth + 1,
      });
    }
  }

  return doc;
}
