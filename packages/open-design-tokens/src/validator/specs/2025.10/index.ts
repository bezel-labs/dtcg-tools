import type { ValidationIssue } from '../../../core/issue.js';
import { isPlainObject } from '../../../core/predicates.js';
import type { PreparedDocument } from '../../../core/prepare.js';
import type { ValidationContext } from '../../context.js';
import { createIssue } from '../../context.js';
import { typeName } from '../../primitives.js';
import type { ValidationStats } from '../../result.js';
import { createResolver } from './aliases/resolver.js';
import { validateGroup } from './groups/validate-group.js';
import { validateDesignToken } from './tokens/validate-design-token.js';

export interface DocumentValidation {
  issues: ValidationIssue[];
  stats: ValidationStats;
}

/**
 * Orders issues deterministically: by the document position of the token or
 * group they belong to (pre-order), then by the order they were produced.
 * Issues on sub-paths (`/a/$value/x`) sort with their nearest indexed node.
 */
export function orderIssues(doc: PreparedDocument, issues: ValidationIssue[]): ValidationIssue[] {
  const position = new Map<string, number>();
  let i = 0;
  for (const pointer of doc.index.keys()) position.set(pointer, i++);
  const rank = (pointer: string): number => {
    let p = pointer;
    for (;;) {
      const r = position.get(p);
      if (r !== undefined) return r;
      const cut = p.lastIndexOf('/');
      if (cut < 0) return -1;
      p = p.slice(0, cut);
    }
  };
  return issues
    .map((issue, order) => ({ issue, order, rank: rank(issue.path.pointer) }))
    .sort((a, b) => a.rank - b.rank || a.order - b.order)
    .map((x) => x.issue);
}

function ctxAt(ctx: ValidationContext, path: readonly string[]): ValidationContext {
  return { spec: ctx.spec, path };
}

/**
 * Validates a prepared document against the 2025.10 format: structural issues
 * from preparation, then every group and token in document order. Alias
 * resolution and `$extends` merging arrive in Milestone 4; composite values in
 * Milestone 5.
 */
export function validateDocument(
  doc: PreparedDocument,
  ctx: ValidationContext,
): DocumentValidation {
  const issues: ValidationIssue[] = [];
  const stats: ValidationStats = { tokens: 0, groups: 0, aliases: 0 };

  if (doc.parseError) {
    issues.push(createIssue(ctx, 'document.invalid-json', { reason: doc.parseError.reason }));
    return { issues, stats };
  }
  if (!isPlainObject(doc.root)) {
    issues.push(createIssue(ctx, 'document.not-object', { actualType: typeName(doc.root) }));
    return { issues, stats };
  }

  for (const s of doc.structuralIssues) {
    issues.push(createIssue(ctxAt(ctx, s.path), s.code, s.meta));
  }

  const resolver = createResolver(doc);
  for (const node of doc.index.values()) {
    const nctx = ctxAt(ctx, node.path);
    try {
      if (node.kind === 'group') {
        stats.groups += 1;
        issues.push(...validateGroup(node, resolver, nctx));
      } else {
        stats.tokens += 1;
        const result = validateDesignToken(node, resolver, nctx);
        if (result.isAlias) stats.aliases += 1;
        issues.push(...result.issues);
      }
    } catch (err) {
      // Only reachable with non-JSON input (throwing getters, exotic objects).
      issues.push(
        createIssue(nctx, 'document.unreadable-node', {
          reason: err instanceof Error ? err.message : String(err),
        }),
      );
    }
  }

  return { issues: orderIssues(doc, issues), stats };
}
