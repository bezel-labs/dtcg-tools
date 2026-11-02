import { MAX_MESSAGE_VALUE_LENGTH } from './limits.js';

export type Severity = 'error' | 'warning';

export interface IssuePath {
  /** RFC 6901 JSON pointer, e.g. `/colors/primary/$value`. */
  pointer: string;
  /** Dotted path, e.g. `colors.primary.$value`. */
  dot: string;
}

export interface ValidationIssue {
  /** Stable machine-readable code such as `token.value.missing`. */
  code: string;
  /** Human-readable, plain-text message rendered from the message catalog. */
  message: string;
  severity: Severity;
  path: IssuePath;
  /** Structured details (expected/actual values, alias chains, ...). */
  meta?: Record<string, unknown>;
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: escaping control characters is the purpose of this regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f\u2028\u2029]/g;

/**
 * Formats a user-supplied value for inclusion in a message: truncated and with
 * control characters escaped, so a hostile token name cannot inject terminal
 * sequences or line breaks into diagnostics.
 */
export function fmt(value: unknown): string {
  let text: string;
  if (typeof value === 'string') {
    text = JSON.stringify(value);
  } else if (value === undefined) {
    text = 'undefined';
  } else {
    try {
      text = JSON.stringify(value) ?? String(value);
    } catch {
      text = Object.prototype.toString.call(value);
    }
  }
  text = text.replace(CONTROL_CHARS, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
  if (text.length > MAX_MESSAGE_VALUE_LENGTH) {
    text = `${text.slice(0, MAX_MESSAGE_VALUE_LENGTH)}…`;
  }
  return text;
}
