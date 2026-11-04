import type { PreparedDocument } from '../core/prepare.js';
import { prepareDocument } from '../core/prepare.js';
import { createRootContext } from './context.js';
import type { SpecId } from './registry.js';
import { getSpec, LATEST_SPEC } from './registry.js';
import type { ValidationResult } from './result.js';
import { toResult } from './result.js';
import type { MessageCatalog } from './specs/2025.10/messages.js';

export interface ValidateOptions {
  /** Spec version to validate against. Defaults to the latest supported. */
  spec?: SpecId;
  /**
   * Message wording by issue code, for codes you want phrased differently (a product's own voice,
   * another language). Codes not listed keep the built-in message. Codes, severities, paths, and
   * `meta` are never affected.
   */
  messages?: Partial<MessageCatalog>;
}

/**
 * Validates a DTCG design tokens document.
 *
 * Accepts a parsed object, a JSON string, or a document from
 * {@link prepareDocument}. Invalid input of any shape yields diagnostics in the
 * result; it never throws. The only exception is an unknown `spec` option,
 * which is a programmer error.
 *
 * @example
 * ```ts
 * const result = validateDtcg({
 *   color: { primary: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0] } } },
 * });
 * result.valid; // true
 * ```
 */
export function validateDtcg(
  input: unknown | PreparedDocument,
  options: ValidateOptions = {},
): ValidationResult {
  const spec = getSpec(options.spec ?? LATEST_SPEC);
  const doc = prepareDocument(input, { spec: spec.id });
  const ctx = createRootContext(spec.id, options.messages ? { messages: options.messages } : {});
  const { issues, stats } = spec.validateDocument(doc, ctx);
  return toResult(spec.id, issues, stats);
}

/** Alias of {@link validateDtcg}. */
export const validate = validateDtcg;
