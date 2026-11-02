/**
 * Example vendor schema for the `extensions-schema` rule. Nothing here runs
 * unless a consumer opts in; it exists to show how a project can describe the
 * shape of its own `$extensions` block.
 *
 * @example
 * ```ts
 * import { lintDtcg } from 'open-design-tokens/linter';
 * import { exampleAppSchema } from './path/to/your/vendor-schema.js';
 * lintDtcg(tokens, { rules: { 'extensions-schema': ['error', { vendors: { 'com.example.app': exampleAppSchema } }] } });
 * ```
 */
import type { FieldSchema } from '../rules/extensions.js';

const NAME_RE = /^[a-z0-9-]+$/;

/** An export name: 1 to 64 lowercase letters, digits, or hyphens. */
export function validateExportName(value: unknown): string | undefined {
  if (!Array.isArray(value)) return 'exportName must be an array of names';
  for (const n of value) {
    if (typeof n !== 'string' || n.length < 1 || n.length > 64 || !NAME_RE.test(n)) {
      return `export name ${JSON.stringify(n)} must be 1 to 64 characters of a-z, 0-9, or "-"`;
    }
  }
  return undefined;
}

/** A variant name: same character rules as an export name. */
export function validateVariantName(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length < 1 || value.length > 64 || !NAME_RE.test(value)) {
    return 'variantName must be 1 to 64 characters of a-z, 0-9, or "-"';
  }
  return undefined;
}

export const exampleAppSchema: FieldSchema = {
  fields: {
    exportName: {
      type: 'array',
      items: 'string',
      pattern: NAME_RE,
      min: 1,
      validate: validateExportName,
    },
    variantName: { type: 'string', pattern: NAME_RE, min: 1, max: 64 },
  },
  additionalFields: false,
};
