import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CodePreview } from '../src/components/code-preview.js';
import { JsonEditor, MAX_HIGHLIGHT_CHARS } from '../src/components/json-editor.js';
import { EXAMPLE_GROUPS } from '../src/examples.js';
import { highlightJson, type JsonTokenKind } from '../src/lib/highlight-json.js';

const textsOf = (source: string, kind: JsonTokenKind) =>
  highlightJson(source)
    .filter((token) => token.kind === kind)
    .map((token) => token.text);

describe('highlightJson', () => {
  const source = '{ "$type": "color", "name": "a", "n": -1.5, "t": true, "u": null }';

  it('separates DTCG keys from other keys, and keys from string values', () => {
    expect(textsOf(source, 'dtcg-key')).toEqual(['"$type"']);
    expect(textsOf(source, 'key')).toEqual(['"name"', '"n"', '"t"', '"u"']);
    expect(textsOf(source, 'string')).toEqual(['"color"', '"a"']);
  });

  it('labels numbers and literals', () => {
    expect(textsOf(source, 'number')).toEqual(['-1.5']);
    expect(textsOf(source, 'literal')).toEqual(['true', 'null']);
  });

  it('merges punctuation and whitespace into one plain run', () => {
    expect(textsOf('{ "a": [ ] }', 'plain')).toEqual(['{ ', ': [ ] }']);
  });

  it('gives back every example exactly', () => {
    for (const example of EXAMPLE_GROUPS.flatMap((group) => group.examples)) {
      const tokens = highlightJson(example.json);
      expect(tokens.map((token) => token.text).join('')).toBe(example.json);
    }
  });

  it('still colors broken JSON without throwing', () => {
    const broken = '{ "color": { "$type": "color"';
    expect(textsOf(broken, 'key')).toEqual(['"color"']);
    expect(textsOf(broken, 'dtcg-key')).toEqual(['"$type"']);
    expect(
      highlightJson('{ "unterminated')
        .map((token) => token.text)
        .join(''),
    ).toBe('{ "unterminated');
  });
});

describe('JsonEditor', () => {
  afterEach(cleanup);

  const renderEditor = (value: string, onChange = () => {}) => {
    const { container } = render(
      <JsonEditor id="editor" ref={null} value={value} onChange={onChange} />,
    );
    return {
      input: container.querySelector('textarea') as HTMLTextAreaElement,
      highlight: container.querySelector('pre') as HTMLPreElement,
    };
  };

  it('colors a copy of the text that matches the textarea and is hidden from readers', () => {
    const value = '{"$type":"color"}';
    const { input, highlight } = renderEditor(value);
    expect(input.value).toBe(value);
    expect(highlight.textContent).toBe(`${value}\n`);
    expect(highlight.getAttribute('aria-hidden')).toBe('true');
    expect(highlight.querySelector('.tok-dtcg-key')?.textContent).toBe('"$type"');
  });

  it('reports edits', () => {
    const onChange = vi.fn();
    const { input } = renderEditor('{}', onChange);
    fireEvent.change(input, { target: { value: '[]' } });
    expect(onChange).toHaveBeenCalledWith('[]');
  });

  it('keeps the colored copy scrolled with the textarea', () => {
    const { input, highlight } = renderEditor('{}');
    input.scrollTop = 120;
    input.scrollLeft = 40;
    fireEvent.scroll(input);
    expect(highlight.scrollTop).toBe(120);
    expect(highlight.scrollLeft).toBe(40);
  });

  it('shows plain text above the size limit', () => {
    const value = `"${'a'.repeat(MAX_HIGHLIGHT_CHARS)}"`;
    const { highlight } = renderEditor(value);
    expect(highlight.textContent).toBe(`${value}\n`);
    expect(highlight.querySelector('span')).toBeNull();
  });
});

describe('CodePreview', () => {
  afterEach(cleanup);

  it('renders punctuation as text, so the DOM stays small', () => {
    const { container } = render(<CodePreview source={'{ "a": [ 1 ] }'} />);
    expect(container.querySelectorAll('span')).toHaveLength(2);
  });

  it('renders colored spans and treats markup in the source as text', () => {
    const source = '{"$value":"<img src=x onerror=alert(1)>"}';
    const { container } = render(<CodePreview source={source} />);
    expect(container.querySelector('pre')?.textContent).toBe(source);
    expect(container.querySelector('.tok-dtcg-key')?.textContent).toBe('"$value"');
    expect(container.querySelector('img')).toBeNull();
  });
});
