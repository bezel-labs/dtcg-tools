import { fmt } from '../../core/issue.js';
import { defineRule } from '../define.js';

export interface LengthOptions {
  /** Minimum length; omit or -1 for no minimum. */
  min?: number;
  /** Maximum length; omit or -1 for no maximum. */
  max?: number;
}

function validateLengthOptions(o: unknown): string | undefined {
  if (o === undefined) return undefined;
  if (typeof o !== 'object' || o === null) return 'options must be an object with optional min/max';
  const { min, max } = o as LengthOptions;
  for (const [k, v] of [
    ['min', min],
    ['max', max],
  ] as const) {
    if (v !== undefined && (!Number.isInteger(v) || (v as number) < -1))
      return `${k} must be an integer >= -1`;
  }
  return undefined;
}

function check(
  value: string,
  what: string,
  o: LengthOptions,
  report: (code: string, message: string, meta: Record<string, unknown>) => void,
): void {
  const length = [...value].length; // code points, so emoji count once
  if (o.min !== undefined && o.min >= 0 && length < o.min) {
    report('too-short', `${what} ${fmt(value)} is ${length} characters; minimum is ${o.min}.`, {
      length,
      min: o.min,
    });
  }
  if (o.max !== undefined && o.max >= 0 && length > o.max) {
    report('too-long', `${what} ${fmt(value)} is ${length} characters; maximum is ${o.max}.`, {
      length,
      max: o.max,
    });
  }
}

export const tokenNameLength = defineRule<LengthOptions>({
  id: 'token-name-length',
  meta: {
    description: 'Token names must be within a length range.',
    defaultSeverity: 'warning',
    defaultOptions: {},
    validateOptions: validateLengthOptions,
  },
  create(ctx) {
    return {
      token(node) {
        const name = node.path[node.path.length - 1];
        if (name === undefined || name === '$root') return;
        check(name, 'Token name', ctx.options, (code, message, meta) =>
          ctx.report({ code, message, path: node.path, meta }),
        );
      },
    };
  },
});

export const groupNameLength = defineRule<LengthOptions>({
  id: 'group-name-length',
  meta: {
    description: 'Group names must be within a length range.',
    defaultSeverity: 'warning',
    defaultOptions: {},
    validateOptions: validateLengthOptions,
  },
  create(ctx) {
    return {
      group(node) {
        const name = node.path[node.path.length - 1];
        if (name === undefined) return;
        check(name, 'Group name', ctx.options, (code, message, meta) =>
          ctx.report({ code, message, path: node.path, meta }),
        );
      },
    };
  },
});

export const descriptionLength = defineRule<LengthOptions>({
  id: 'description-length',
  meta: {
    description: '$description text must be within a length range.',
    defaultSeverity: 'warning',
    defaultOptions: {},
    validateOptions: validateLengthOptions,
  },
  create(ctx) {
    const visit = (node: { path: readonly string[]; raw: Record<string, unknown> }) => {
      const d = node.raw.$description;
      if (typeof d !== 'string') return;
      check(d, 'Description', ctx.options, (code, message, meta) =>
        ctx.report({ code, message, path: [...node.path, '$description'], meta }),
      );
    };
    return { token: visit, group: visit };
  },
});
