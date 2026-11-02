import type { Severity } from '../../../core/issue.js';
import { fmt } from '../../../core/issue.js';
import { MAX_DEPTH } from '../../../core/limits.js';

/**
 * Every issue the 2025.10 validator can emit. Codes are stable public API and
 * follow `<section>.<field>.<problem>`.
 */
export type IssueCode =
  | 'document.not-object'
  | 'document.invalid-json'
  | 'document.too-deep'
  | 'document.circular'
  | 'document.unreadable-node';

type Meta = Record<string, unknown>;

/** Message catalog (English). Values come from `meta` and are always passed through `fmt`. */
export const MESSAGES: Record<IssueCode, (meta: Meta) => string> = {
  'document.not-object': (m) =>
    `The document root must be a JSON object, received ${fmt(m.actualType)}.`,
  'document.invalid-json': (m) => `The input is not valid JSON: ${fmt(m.reason)}.`,
  'document.too-deep': () =>
    `The document nests groups deeper than the supported limit of ${MAX_DEPTH} levels.`,
  'document.circular': () =>
    'The input object contains a circular reference and cannot be validated.',
  'document.unreadable-node': (m) =>
    `A property could not be read while validating: ${fmt(m.reason)}.`,
};

export const DEFAULT_SEVERITY: Record<IssueCode, Severity> = {
  'document.not-object': 'error',
  'document.invalid-json': 'error',
  'document.too-deep': 'error',
  'document.circular': 'error',
  'document.unreadable-node': 'error',
};

export const ISSUE_CODES = Object.keys(MESSAGES) as IssueCode[];
