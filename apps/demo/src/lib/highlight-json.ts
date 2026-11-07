import Prism from 'prismjs/components/prism-core';
// Registers itself on the Prism global that the core import above creates.
import 'prismjs/components/prism-json';
import type { Grammar, TokenStream } from 'prismjs';

export type JsonTokenKind =
  | 'key'
  | 'dtcg-key'
  | 'string'
  | 'number'
  | 'literal'
  | 'punctuation'
  | 'plain';

export interface JsonToken {
  text: string;
  kind: JsonTokenKind;
}

const KIND_BY_PRISM_TYPE: Record<string, JsonTokenKind> = {
  property: 'key',
  string: 'string',
  number: 'number',
  boolean: 'literal',
  null: 'literal',
  punctuation: 'punctuation',
  operator: 'punctuation',
};

const flatten = (stream: TokenStream, kind: JsonTokenKind): JsonToken[] => {
  if (typeof stream === 'string') return [{ text: stream, kind }];
  if (Array.isArray(stream)) return stream.flatMap((part) => flatten(part, kind));
  return flatten(stream.content, KIND_BY_PRISM_TYPE[stream.type] ?? kind);
};

/**
 * Splits JSON into colorable tokens, without producing HTML. Joining every
 * token's text gives back the source exactly, and broken JSON is fine.
 */
export function highlightJson(source: string): JsonToken[] {
  const stream = Prism.tokenize(source, Prism.languages.json as Grammar);
  return flatten(stream, 'plain').map(({ text, kind }) => ({
    text,
    // DTCG reserves $-prefixed keys, which are what the examples teach.
    kind: kind === 'key' && text.startsWith('"$') ? 'dtcg-key' : kind,
  }));
}
