import type { ValidationIssue } from '../core/issue.js';
import { toIssuePath } from '../core/path.js';
import type { SpecId } from './registry.js';
import type { IssueCode } from './specs/2025.10/messages.js';
import { DEFAULT_SEVERITY, MESSAGES } from './specs/2025.10/messages.js';

export interface ValidationContext {
  spec: SpecId;
  /** Path segments from the root to the node being validated. */
  path: readonly string[];
}

export function createRootContext(spec: SpecId): ValidationContext {
  return { spec, path: [] };
}

export function child(ctx: ValidationContext, key: string): ValidationContext {
  return { spec: ctx.spec, path: [...ctx.path, key] };
}

/** Builds an issue at the context's path, rendering the message from the catalog. */
export function createIssue(
  ctx: ValidationContext,
  code: IssueCode,
  meta?: Record<string, unknown>,
): ValidationIssue {
  const issue: ValidationIssue = {
    code,
    message: MESSAGES[code](meta ?? {}),
    severity: DEFAULT_SEVERITY[code],
    path: toIssuePath(ctx.path),
  };
  if (meta) issue.meta = meta;
  return issue;
}
