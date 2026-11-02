import { findNodeAtLocation, type Node, parseTree, type Segment } from 'jsonc-parser';
import { parseJsonPointer } from 'open-design-tokens/validator';

export interface Position {
  line: number;
  column: number;
  offset: number;
  length: number;
}

export interface PositionIndex {
  /** Resolves a JSON pointer to its position in the source, or the nearest ancestor that exists. */
  locate(pointer: string): Position | undefined;
}

/**
 * Builds a locator over the raw source text so issues can point at a line and
 * column. Uses jsonc-parser's tree, which tolerates broken JSON, so the editor
 * can still highlight parse errors.
 */
export function createPositionIndex(source: string): PositionIndex {
  const root = parseTree(source, [], { allowTrailingComma: true, disallowComments: false });
  const lineStarts = [0];
  for (let i = 0; i < source.length; i += 1) if (source[i] === '\n') lineStarts.push(i + 1);
  const toLineCol = (offset: number): { line: number; column: number } => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if ((lineStarts[mid] as number) <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, column: offset - (lineStarts[lo] as number) + 1 };
  };
  const fromNode = (node: Node): Position => {
    // Point at the property name when the node is an object property value.
    const target = node.parent?.type === 'property' ? (node.parent.children?.[0] ?? node) : node;
    return { ...toLineCol(target.offset), offset: target.offset, length: target.length };
  };
  return {
    locate(pointer) {
      if (!root) return undefined;
      const segments = parseJsonPointer(pointer);
      if (!segments) return undefined;
      for (let n = segments.length; n >= 0; n -= 1) {
        const path: Segment[] = segments
          .slice(0, n)
          .map((s) => (/^(0|[1-9][0-9]*)$/.test(s) ? Number(s) : s));
        const node = n === 0 ? root : findNodeAtLocation(root, path);
        if (node) {
          // Array indices resolve to the element itself; properties to their key.
          return fromNode(node);
        }
      }
      return undefined;
    },
  };
}
