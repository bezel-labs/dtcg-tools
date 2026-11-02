import { type LintResult, lint } from 'open-design-tokens/linter';
import { type ValidationResult, validateDtcg } from 'open-design-tokens/validator';
import { useEffect, useMemo, useRef, useState } from 'react';
import { IssueList, type Row } from './components/issue-list.js';
import { Toolbar } from './components/toolbar.js';
import { EXAMPLE_GROUPS, FULL_PROJECT_JSON } from './examples.js';
import { createPositionIndex } from './lib/positions.js';

/** Inputs above this size are refused before parsing. */
const MAX_INPUT_BYTES = 2 * 1024 * 1024;

const LINT_CONFIG = { extends: ['recommended' as const] };

export function App() {
  const [source, setSource] = useState(FULL_PROJECT_JSON);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [lintResult, setLintResult] = useState<LintResult | null>(null);
  const [lintEnabled, setLintEnabled] = useState(false);
  const [tooLarge, setTooLarge] = useState(false);
  const [openArea, setOpenArea] = useState<string | null>('Full project');
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (source.length > MAX_INPUT_BYTES) {
        setTooLarge(true);
        setResult(null);
        setLintResult(null);
        return;
      }
      setTooLarge(false);
      if (lintEnabled) {
        const r = lint(source, LINT_CONFIG);
        setLintResult(r);
        setResult(r.validation);
      } else {
        setLintResult(null);
        setResult(validateDtcg(source));
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [source, lintEnabled]);

  const positions = useMemo(() => createPositionIndex(source), [source]);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const issue of result?.issues ?? []) out.push({ issue, source: 'validator' });
    for (const issue of lintResult?.issues ?? []) out.push({ issue, source: 'linter' });
    return out;
  }, [result, lintResult]);

  const select = (offset: number, length: number) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(offset, offset + length);
    // Scroll the selection into view by measuring the line height.
    const line = source.slice(0, offset).split('\n').length - 1;
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 20;
    el.scrollTop = Math.max(0, line * lineHeight - el.clientHeight / 2);
  };

  const format = () => {
    try {
      setSource(`${JSON.stringify(JSON.parse(source), null, 2)}\n`);
    } catch {
      // Leave invalid JSON untouched; the result pane already shows the parse error.
    }
  };

  const errors = (result?.errors.length ?? 0) + (lintResult?.errors.length ?? 0);
  const warnings = (result?.warnings.length ?? 0) + (lintResult?.warnings.length ?? 0);
  const valid = lintResult ? lintResult.valid : (result?.valid ?? true);

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
          {EXAMPLE_GROUPS.map((group) => (
            <details
              key={group.area}
              className="area"
              open={openArea === group.area}
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
          ))}
        </aside>
        <section className="workspace">
          <div className="pane">
            <Toolbar
              onLoad={setSource}
              onFormat={format}
              onClear={() => setSource('')}
              lintEnabled={lintEnabled}
              onToggleLint={setLintEnabled}
            />
            <label className="pane-title" htmlFor="editor">
              tokens.json
            </label>
            <textarea
              id="editor"
              ref={editorRef}
              className="editor"
              spellCheck={false}
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <div className="pane">
            <h2 className="pane-title">
              {lintEnabled ? 'Validation and lint results' : 'Validation results'}
            </h2>
            {tooLarge ? (
              <p className="status status-error">
                Input is larger than 2 MB and was not validated.
              </p>
            ) : result ? (
              <>
                <p className={`status ${valid ? 'status-ok' : 'status-error'}`} role="status">
                  {valid ? 'Valid' : 'Invalid'} · {errors} errors · {warnings} warnings · spec{' '}
                  {result.spec} · {result.stats.tokens} tokens, {result.stats.groups} groups,{' '}
                  {result.stats.aliases} aliases
                  {lintResult && lintResult.skipped.length > 0
                    ? ` · ${lintResult.skipped.length} rule checks skipped on invalid nodes`
                    : ''}
                </p>
                <IssueList rows={rows} positions={positions} onSelect={select} />
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
