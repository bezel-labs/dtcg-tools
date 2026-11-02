import { type ValidationResult, validateDtcg } from 'open-design-tokens/validator';
import { useEffect, useState } from 'react';

/** Inputs above this size are refused before parsing. */
const MAX_INPUT_BYTES = 2 * 1024 * 1024;

const SAMPLE = `{
  "color": {
    "$type": "color",
    "primary": {
      "$value": { "colorSpace": "srgb", "components": [0.2, 0.4, 1] }
    }
  }
}
`;

export function App() {
  const [source, setSource] = useState(SAMPLE);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [tooLarge, setTooLarge] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (source.length > MAX_INPUT_BYTES) {
        setTooLarge(true);
        setResult(null);
        return;
      }
      setTooLarge(false);
      setResult(validateDtcg(source));
    }, 150);
    return () => clearTimeout(handle);
  }, [source]);

  return (
    <main className="app">
      <header className="header">
        <h1>Open Design Tokens Playground</h1>
        <p>TypeScript toolkit for validating and linting DTCG design tokens.</p>
      </header>
      <section className="panes">
        <div className="pane">
          <label className="pane-title" htmlFor="editor">
            tokens.json
          </label>
          <textarea
            id="editor"
            className="editor"
            spellCheck={false}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>
        <div className="pane">
          <h2 className="pane-title">Validation Results</h2>
          {tooLarge ? (
            <p className="status status-error">Input is larger than 2 MB and was not validated.</p>
          ) : result ? (
            <>
              <p className={`status ${result.valid ? 'status-ok' : 'status-error'}`}>
                {result.valid ? 'Valid' : 'Invalid'} · {result.errors.length} errors ·{' '}
                {result.warnings.length} warnings · spec {result.spec}
              </p>
              <ul className="issues">
                {result.issues.map((issue) => (
                  <li
                    key={`${issue.path.pointer}|${issue.code}|${issue.message}`}
                    className="issue"
                  >
                    <span className={`badge badge-${issue.severity}`}>{issue.severity}</span>
                    <code className="path">{issue.path.dot || '(root)'}</code>
                    <span className="message">{issue.message}</span>
                    <code className="code">{issue.code}</code>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}
