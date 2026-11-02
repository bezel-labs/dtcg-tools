import type { ValidationIssue } from '../core/issue.js';
import { createIssue, createRootContext } from './context.js';
import type { SpecId } from './registry.js';
import { getSpec, LATEST_SPEC } from './registry.js';
import type { ValidationResult } from './result.js';
import { toResult } from './result.js';

export interface ValidateOptions {
  /** Spec version to validate against. Defaults to the latest supported. */
  spec?: SpecId;
}

/**
 * Validates a DTCG design tokens document.
 *
 * Accepts a parsed object or a JSON string. Invalid input of any shape yields
 * diagnostics in the result; it never throws. The only exception is an unknown
 * `spec` option, which is a programmer error.
 *
 * @example
 * ```ts
 * const result = validateDtcg({ color: { primary: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0] } } } });
 * result.valid; // true
 * ```
 */
export function validateDtcg(input: unknown, options: ValidateOptions = {}): ValidationResult {
  const spec = getSpec(options.spec ?? LATEST_SPEC);
  const ctx = createRootContext(spec.id);

  let root: unknown = input;
  if (typeof input === 'string') {
    try {
      root = JSON.parse(input);
    } catch (err) {
      const issue: ValidationIssue = createIssue(ctx, 'document.invalid-json', {
        reason: err instanceof Error ? err.message : String(err),
      });
      return toResult(spec.id, [issue], { tokens: 0, groups: 0, aliases: 0 });
    }
  }

  const { issues, stats } = spec.validateDocument(root, ctx);
  return toResult(spec.id, issues, stats);
}

/** Alias of {@link validateDtcg}. */
export const validate = validateDtcg;
