import Prism from 'prismjs/components/prism-core';
// Registers itself on the Prism global that the core import above creates.
import 'prismjs/components/prism-json';
import type { Grammar, TokenStream } from 'prismjs';

export type JsonTokenKind = 'key' | 'dtcg-key' | 'string' | 'number' | 'literal' | 'plain';

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
};

const flatten = (stream: TokenStream, kind: JsonTokenKind): JsonToken[] => {
  if (typeof stream === 'string') return [{ text: stream, kind }];
  if (Array.isArray(stream)) return stream.flatMap((part) => flatten(part, kind));
  return flatten(stream.content, KIND_BY_PRISM_TYPE[stream.type] ?? kind);
};

/**
 * Splits JSON into colorable tokens, without producing HTML. Joining every
 * token's text gives back the source exactly, and broken JSON is fine.
 *
 * Punctuation and whitespace merge into `plain` runs. They are most of a token
 * file, and rendering them as text instead of spans keeps the DOM small.
 */
export function highlightJson(source: string): JsonToken[] {
  const stream = Prism.tokenize(source, Prism.languages.json as Grammar);
  const tokens: JsonToken[] = [];
  for (const { text, kind } of flatten(stream, 'plain')) {
    const previous = tokens.at(-1);
    if (kind === 'plain' && previous?.kind === 'plain') {
      previous.text += text;
    } else {
      // DTCG reserves $-prefixed keys, which are what the examples teach.
      tokens.push({ text, kind: kind === 'key' && text.startsWith('"$') ? 'dtcg-key' : kind });
    }
  }
  return tokens;
}
