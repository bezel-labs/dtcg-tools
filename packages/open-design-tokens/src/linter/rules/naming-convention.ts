import { fmt } from '../../core/issue.js';
import { defineRule } from '../define.js';

export type NamingStyle = 'kebab' | 'camel' | 'pascal' | 'snake' | (string & {});

export interface NamingOptions {
  /** Style for token names; a string other than the four presets is a custom regular expression. */
  tokens?: NamingStyle;
  /** Style for group names. */
  groups?: NamingStyle;
}

const PRESET_PATTERNS: Record<string, RegExp> = {
  kebab: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  camel: /^[a-z][a-zA-Z0-9]*$/,
  pascal: /^[A-Z][a-zA-Z0-9]*$/,
  snake: /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
};

/** Custom patterns come from trusted config, but are still bounded to keep them cheap. */
const MAX_PATTERN_LENGTH = 200;

function compile(style: NamingStyle | undefined): { pattern: RegExp; label: string } | undefined {
  if (style === undefined) return undefined;
  const preset = PRESET_PATTERNS[style];
  if (preset) return { pattern: preset, label: `${style}-case` };
  if (style.length > MAX_PATTERN_LENGTH)
    throw new RangeError('naming-convention: custom pattern is too long');
  // The only `new RegExp` in the package: the pattern is config, never document content.
  return { pattern: new RegExp(style, 'u'), label: `pattern ${style}` };
}

export const namingConvention = defineRule<NamingOptions>({
  id: 'naming-convention',
  meta: {
    description:
      'Token and group names follow a naming style (kebab, camel, pascal, snake, or a custom pattern).',
    defaultSeverity: 'warning',
    defaultOptions: {},
    validateOptions(o) {
      if (o === undefined) return undefined;
      if (typeof o !== 'object' || o === null)
        return 'options must be an object with optional tokens/groups';
      for (const key of ['tokens', 'groups'] as const) {
        const v = (o as NamingOptions)[key];
        if (v === undefined) continue;
        if (typeof v !== 'string') return `${key} must be a style name or a pattern string`;
        try {
          compile(v);
        } catch (err) {
          return `${key}: ${err instanceof Error ? err.message : String(err)}`;
        }
      }
      return undefined;
    },
  },
  create(ctx) {
    const tokens = compile(ctx.options.tokens);
    const groups = compile(ctx.options.groups);
    const check = (
      node: { path: readonly string[] },
      rule: { pattern: RegExp; label: string } | undefined,
      what: string,
    ) => {
      if (!rule) return;
      const name = node.path[node.path.length - 1];
      if (name === undefined || name === '$root') return;
      if (!rule.pattern.test(name)) {
        ctx.report({
          code: 'mismatch',
          message: `${what} ${fmt(name)} does not match ${rule.label}.`,
          path: node.path,
          meta: { name, expected: rule.label },
        });
      }
    };
    return {
      token: (node) => check(node, tokens, 'Token name'),
      group: (node) => check(node, groups, 'Group name'),
    };
  },
});
