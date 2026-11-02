import { defineRule } from '../define.js';

export interface AliasDepthOptions {
  /** Maximum number of hops an alias chain may take before reaching a concrete value. */
  max: number;
}

export const aliasMaxDepth = defineRule<AliasDepthOptions>({
  id: 'max-alias-depth',
  meta: {
    description: 'Alias chains resolve within a maximum number of hops.',
    defaultSeverity: 'warning',
    defaultOptions: { max: 5 },
    validateOptions: (o) =>
      typeof o === 'object' &&
      o !== null &&
      Number.isInteger((o as AliasDepthOptions).max) &&
      (o as AliasDepthOptions).max >= 1
        ? undefined
        : 'max must be an integer >= 1',
  },
  create(ctx) {
    const check = (node: { pointer: string; path: readonly string[] }) => {
      const res = ctx.resolver.resolveAlias(node.pointer);
      if (res.status !== 'ok') return;
      const hops = res.chain.length - 1;
      if (hops > ctx.options.max) {
        ctx.report({
          code: 'exceeded',
          message: `Alias chain is ${hops} hops deep; maximum is ${ctx.options.max}.`,
          path: node.path,
          meta: { hops, max: ctx.options.max, chain: res.chain },
        });
      }
    };
    return { token: check };
  },
});

export interface UnusedTokensOptions {
  /**
   * Dot-path patterns for tokens that are consumed outside the file (semantic
   * or component layers). `*` matches one segment, `**` any number.
   * Example: `['component.**', 'semantic.*.text']`.
   */
  ignore?: readonly string[];
}

/** Compiles a dot-path pattern into a matcher over path segments. */
function pathMatcher(pattern: string): (path: readonly string[]) => boolean {
  const parts = pattern.split('.');
  const match = (pi: number, si: number, path: readonly string[]): boolean => {
    if (pi === parts.length) return si === path.length;
    const p = parts[pi] as string;
    if (p === '**') {
      for (let k = si; k <= path.length; k += 1) if (match(pi + 1, k, path)) return true;
      return false;
    }
    if (si >= path.length) return false;
    return (p === '*' || p === path[si]) && match(pi + 1, si + 1, path);
  };
  return (path) => match(0, 0, path);
}

export const noUnusedTokens = defineRule<UnusedTokensOptions>({
  id: 'no-unused-tokens',
  meta: {
    description:
      'Every token is referenced by at least one alias or $ref, except those matched by ignore patterns.',
    defaultSeverity: 'warning',
    recommended: true,
    defaultOptions: { ignore: [] },
    validateOptions: (o) =>
      typeof o === 'object' &&
      o !== null &&
      Array.isArray((o as UnusedTokensOptions).ignore) &&
      ((o as UnusedTokensOptions).ignore as unknown[]).every((p) => typeof p === 'string')
        ? undefined
        : 'ignore must be an array of dot-path patterns',
  },
  create(ctx) {
    const ignored = (ctx.options.ignore ?? []).map(pathMatcher);
    return {
      document() {
        for (const node of ctx.doc.index.values()) {
          if (node.kind !== 'token' && node.kind !== 'reference') continue;
          if (ctx.isInvalid(node.pointer)) continue;
          if (ignored.some((m) => m(node.path))) continue;
          if (!ctx.references.referenced.has(node.pointer)) {
            ctx.report({
              code: 'unreferenced',
              message: 'Token is never referenced by another token.',
              path: node.path,
            });
          }
        }
      },
    };
  },
});

export const noDeprecatedAlias = defineRule<undefined>({
  id: 'no-deprecated-alias',
  meta: {
    description: 'Tokens do not alias deprecated tokens.',
    defaultSeverity: 'warning',
    recommended: true,
  },
  create(ctx) {
    const isDeprecated = (pointer: string): boolean => {
      let n = ctx.doc.index.get(pointer);
      while (n) {
        const d = n.raw.$deprecated;
        if (d === true || typeof d === 'string') return true;
        if (d === false) return false;
        n = n.parentPointer === undefined ? undefined : ctx.doc.index.get(n.parentPointer);
      }
      return false;
    };
    const check = (node: { pointer: string; path: readonly string[] }) => {
      if (isDeprecated(node.pointer)) return; // a deprecated token may point at another deprecated one
      for (const target of ctx.references.outgoing.get(node.pointer) ?? []) {
        if (isDeprecated(target)) {
          ctx.report({
            code: 'target',
            message: `References deprecated token at ${target}.`,
            path: node.path,
            meta: { target },
          });
        }
      }
    };
    return { token: check };
  },
});
