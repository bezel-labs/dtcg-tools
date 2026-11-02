import { fmt } from '../core/issue.js';
import { toIssuePath } from '../core/path.js';
import { isAlias, isPlainObject, isReference, isToken } from '../core/predicates.js';
import type { PreparedDocument } from '../core/prepare.js';
import { prepareDocument } from '../core/prepare.js';
import { parseAlias, parseRef } from '../validator/specs/2025.10/aliases/parse.js';
import type { Resolver } from '../validator/specs/2025.10/aliases/resolver.js';
import { createResolver } from '../validator/specs/2025.10/aliases/resolver.js';
import { validateDtcg } from '../validator/validate-dtcg.js';
import type { ResolveOptions } from './config.js';
import { resolveConfig } from './config.js';
import type {
  LintConfig,
  LintContext,
  LintIssue,
  LintReport,
  LintResult,
  ReferenceGraph,
  ResolvedConfig,
  RuleVisitor,
  Skipped,
} from './types.js';

export interface LintOptions extends ResolveOptions {
  /** A config already passed through `resolveConfig`; takes precedence over `config`. */
  resolved?: ResolvedConfig;
}

// Control characters are escaped so rule messages cannot inject terminal sequences.
// biome-ignore lint/suspicious/noControlCharactersInRegex: escaping control characters is the purpose
const CONTROL = /[\u0000-\u001f\u007f]/g;
const sanitize = (s: string): string =>
  s.replace(CONTROL, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);

/** Builds the reference graph once: alias and `$ref` edges between tokens. */
export function buildReferenceGraph(doc: PreparedDocument, resolver: Resolver): ReferenceGraph {
  const referenced = new Set<string>();
  const outgoing = new Map<string, string[]>();
  const addEdge = (from: string, to: string) => {
    referenced.add(to);
    const list = outgoing.get(from);
    if (list) list.push(to);
    else outgoing.set(from, [to]);
  };
  const scan = (from: string, value: unknown, depth: number) => {
    if (depth > 64) return;
    if (typeof value === 'string' && isAlias(value)) {
      const segments = parseAlias(value);
      const found = segments ? resolver.lookupPath(segments) : undefined;
      if (found && isToken(found.value)) addEdge(from, found.originPointer);
      return;
    }
    if (isReference(value)) {
      const parsed = parseRef(value.$ref);
      const owner = parsed.ok ? resolver.owningToken(parsed.segments) : undefined;
      if (owner) addEdge(from, owner.node.pointer);
      return;
    }
    if (Array.isArray(value)) for (const v of value) scan(from, v, depth + 1);
    else if (isPlainObject(value))
      for (const k of Object.keys(value)) scan(from, value[k], depth + 1);
  };
  for (const node of doc.index.values()) {
    if (node.kind === 'token') scan(node.pointer, node.raw.$value, 0);
    else if (node.kind === 'reference') scan(node.pointer, { $ref: node.raw.$ref }, 0);
  }
  return { referenced, outgoing };
}

/**
 * Lints a document. Always validates first: rules run only on nodes the
 * validator did not flag with an error, so one spec violation does not
 * cascade into misleading policy findings. Never throws on document input;
 * configuration mistakes are programmer errors and do throw.
 */
export function lint(
  input: unknown,
  config: LintConfig = {},
  options: LintOptions = {},
): LintResult {
  const doc = prepareDocument(input);
  const validation = validateDtcg(doc);
  const resolved = options.resolved ?? resolveConfig(config, options);
  const issues: LintIssue[] = [];
  const skipped: Skipped[] = [];

  if (
    validation.issues.some(
      (i) => i.code === 'document.invalid-json' || i.code === 'document.not-object',
    )
  ) {
    return finish(validation, issues, skipped);
  }

  const resolver = createResolver(doc);
  const references = buildReferenceGraph(doc, resolver);
  const invalidPointers = new Set(validation.errors.map((i) => i.path.pointer));
  const isInvalid = (pointer: string): boolean => {
    for (const p of invalidPointers) if (p === pointer || p.startsWith(`${pointer}/`)) return true;
    return false;
  };

  const visitors: { ruleId: string; visitor: RuleVisitor }[] = [];
  for (const { rule, severity, options: ruleOptions } of resolved.rules) {
    const ctx: LintContext = {
      doc,
      resolver,
      validation,
      references,
      options: ruleOptions,
      isInvalid,
      report(r: LintReport) {
        const path = Array.isArray(r.path)
          ? toIssuePath(r.path as readonly string[])
          : (r.path as LintIssue['path']);
        const issue: LintIssue = {
          ruleId: rule.id,
          code: r.code ? `${rule.id}.${r.code}` : rule.id,
          message: sanitize(r.message),
          severity,
          path,
        };
        if (r.meta) issue.meta = r.meta;
        issues.push(issue);
      },
    };
    visitors.push({ ruleId: rule.id, visitor: rule.create(ctx) });
  }

  for (const node of doc.index.values()) {
    const invalid = isInvalid(node.pointer);
    for (const { ruleId, visitor } of visitors) {
      const fn = node.kind === 'group' ? visitor.group : visitor.token;
      if (!fn) continue;
      if (invalid) {
        skipped.push({ ruleId, pointer: node.pointer, reason: 'node has validation errors' });
        continue;
      }
      fn(node);
    }
  }
  for (const { visitor } of visitors) visitor.document?.();

  return finish(validation, issues, skipped);
}

function finish(
  validation: LintResult['validation'],
  issues: LintIssue[],
  skipped: Skipped[],
): LintResult {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');
  return {
    valid: validation.valid && errors.length === 0,
    issues,
    errors,
    warnings,
    skipped,
    validation,
  };
}

/** Re-exported for rule authors who build messages from user values. */
export { fmt };
