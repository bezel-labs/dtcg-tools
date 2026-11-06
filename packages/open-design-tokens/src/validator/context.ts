import type { ValidationIssue } from '../core/issue.js';
import { toIssuePath } from '../core/path.js';
import type { SpecId } from './registry.js';
import type { IssueCode, IssueMeta, MessageCatalog } from './specs/2025.10/messages.js';
import { DEFAULT_SEVERITY, MESSAGES } from './specs/2025.10/messages.js';

export interface ValidationContext {
  spec: SpecId;
  /** Path segments from the root to the node being validated. */
  path: readonly string[];
  /** Message overrides by code; codes not listed use the built-in catalog. */
  messages?: Partial<MessageCatalog>;
}

export interface ContextOptions {
  messages?: Partial<MessageCatalog>;
}

export function createRootContext(spec: SpecId, options: ContextOptions = {}): ValidationContext {
  const ctx: ValidationContext = { spec, path: [] };
  if (options.messages) ctx.messages = options.messages;
  return ctx;
}

/** The same context (spec, message overrides) at another path. */
export function withPath(ctx: ValidationContext, path: readonly string[]): ValidationContext {
  const next: ValidationContext = { spec: ctx.spec, path };
  if (ctx.messages) next.messages = ctx.messages;
  return next;
}

export function child(ctx: ValidationContext, key: string): ValidationContext {
  return withPath(ctx, [...ctx.path, key]);
}

/**
 * Builds an issue at the context's path. `meta` is typed by `code`; the message comes from the
 * context's override for that code when there is one, else from the built-in catalog.
 */
export function createIssue<C extends IssueCode>(
  ctx: ValidationContext,
  code: C,
  meta?: IssueMeta[C],
): ValidationIssue {
  const render = (ctx.messages?.[code] ?? MESSAGES[code]) as (
    m: IssueMeta[C] | EmptyLike,
  ) => string;
  const issue: ValidationIssue = {
    code,
    message: render(meta ?? {}),
    severity: DEFAULT_SEVERITY[code],
    path: toIssuePath(ctx.path),
  };
  if (meta) issue.meta = meta;
  return issue;
}

type EmptyLike = Record<string, never>;
