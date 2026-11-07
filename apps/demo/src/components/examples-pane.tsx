import { Accordion } from '@base-ui/react/accordion';
import { Button } from '@base-ui/react/button';
import { validateDtcg } from 'open-design-tokens/validator';
import { memo } from 'react';
import { EXAMPLE_GROUPS } from '../examples.js';
import { CodePreview } from './code-preview.js';
import { ScrollPanel } from './scroll-panel.js';

/**
 * Examples the validator accepts. A non-empty `expect` does not mean invalid,
 * because some examples only report warnings.
 */
const VALID_EXAMPLES = new Set(
  EXAMPLE_GROUPS.flatMap((group) => group.examples).filter((ex) => validateDtcg(ex.json).valid),
);

interface Props {
  onLoad(source: string): void;
}

/** Memoized because the app re-renders on every keystroke in the editor. */
export const ExamplesPane = memo(function ExamplesPane({ onLoad }: Props) {
  return (
    <aside className="pane">
      <h2 className="pane-title">Examples by validator</h2>
      <ScrollPanel>
        <Accordion.Root defaultValue={['Full project']} hiddenUntilFound>
          {EXAMPLE_GROUPS.map((group) => (
            <Accordion.Item key={group.area} value={group.area} className="area">
              <Accordion.Header className="area-header">
                <Accordion.Trigger className="area-trigger">
                  <span className="area-title">{group.area}</span>
                  <span className="area-spec">{group.spec}</span>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="area-panel">
                <ul className="example-list">
                  {group.examples.map((ex) => (
                    <li key={ex.title} className="example">
                      <div className="example-head">
                        <div className="example-name">
                          <strong>{ex.title}</strong>
                          {VALID_EXAMPLES.has(ex) ? (
                            <span className="pill pill-valid">Valid</span>
                          ) : (
                            <span className="pill pill-invalid">Invalid</span>
                          )}
                        </div>
                        <Button className="load" onClick={() => onLoad(ex.json)}>
                          Load
                        </Button>
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
                      <CodePreview source={ex.json} />
                    </li>
                  ))}
                </ul>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </ScrollPanel>
    </aside>
  );
});
