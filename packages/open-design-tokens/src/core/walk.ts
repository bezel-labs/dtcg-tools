import type { NodeInfo, PreparedDocument } from './prepare.js';

export interface Visitor {
  token?(node: NodeInfo): void;
  group?(node: NodeInfo): void;
}

/** Visits every indexed node in document order. Reference nodes (`$ref` in place of `$value`) are tokens. */
export function walkDocument(doc: PreparedDocument, visitor: Visitor): void {
  for (const node of doc.index.values()) {
    if (node.kind === 'group') visitor.group?.(node);
    else visitor.token?.(node);
  }
}

export function getNodeAtPointer(doc: PreparedDocument, pointer: string): NodeInfo | undefined {
  return doc.index.get(pointer);
}
