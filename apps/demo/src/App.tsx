import { type ValidationResult, validateDtcg } from 'open-design-tokens/validator';
import { useEffect, useState } from 'react';
import { EXAMPLE_GROUPS } from './examples.js';

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
  const [openArea, setOpenArea] = useState<string | null>(null);

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
      <div className="layout">
        <aside className="examples">
          <h2 className="pane-title">Examples by validator</h2>
          <p className="hint">
            Each example is self-contained. Load one into the editor, then edit it to explore the
            rule. The codes listed are what the validator should report.
          </p>
          {EXAMPLE_GROUPS.map((group) => {
            const open = openArea === group.area;
            return (
              <details
                key={group.area}
                className="area"
                open={open}
                onToggle={(e) => setOpenArea(e.currentTarget.open ? group.area : null)}
              >
                <summary>
                  <span className="area-title">{group.area}</span>
                  <span className="area-spec">{group.spec}</span>
                </summary>
                <ul className="example-list">
                  {group.examples.map((ex) => (
                    <li key={ex.title} className="example">
                      <div className="example-head">
                        <strong>{ex.title}</strong>
                        <button type="button" className="load" onClick={() => setSource(ex.json)}>
                          Load
                        </button>
                      </div>
                      <p className="example-desc">{ex.description}</p>
                      <p className="example-expect">
                        Expect:{' '}
                        {ex.expect.length === 0 ? (
                          <code className="code-ok">valid</code>
                        ) : (
                          <code className="code">{ex.expect.join(', ')}</code>
                        )}
                      </p>
                      <pre className="example-json">{ex.json}</pre>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </aside>
        <section className="workspace">
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
              <p className="status status-error">
                Input is larger than 2 MB and was not validated.
              </p>
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
      </div>
    </main>
  );
}
