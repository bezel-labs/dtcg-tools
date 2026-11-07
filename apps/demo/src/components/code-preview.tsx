import { memo } from 'react';
import { highlightJson } from '../lib/highlight-json.js';

interface Props {
  source: string;
}

/** Memoized because the app re-renders on every keystroke in the editor. */
export const HighlightedJson = memo(function HighlightedJson({ source }: Props) {
  return (
    <>
      {highlightJson(source).map(({ text, kind }, index) =>
        kind === 'plain' ? (
          text
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: index keys reuse spans while typing; offset keys would rebuild them all.
          <span key={index} className={`tok-${kind}`}>
            {text}
          </span>
        ),
      )}
    </>
  );
});

export function CodePreview({ source }: Props) {
  return (
    <pre className="example-json">
      <HighlightedJson source={source} />
    </pre>
  );
}
