import { Checkbox } from '@base-ui/react/checkbox';
import { Field } from '@base-ui/react/field';
import { Toolbar as BaseToolbar } from '@base-ui/react/toolbar';
import { FULL_PROJECT_JSON, INVALID_PROJECT_JSON } from '../examples.js';

interface Props {
  onLoad(source: string): void;
  onFormat(): void;
  onClear(): void;
  lintEnabled: boolean;
  onToggleLint(enabled: boolean): void;
}

export function Toolbar({ onLoad, onFormat, onClear, lintEnabled, onToggleLint }: Props) {
  return (
    <BaseToolbar.Root className="toolbar" aria-label="Editor actions">
      <BaseToolbar.Button onClick={() => onLoad(FULL_PROJECT_JSON)}>
        Valid sample
      </BaseToolbar.Button>
      <BaseToolbar.Button onClick={() => onLoad(INVALID_PROJECT_JSON)}>
        Invalid sample
      </BaseToolbar.Button>
      <BaseToolbar.Button onClick={onFormat}>Format JSON</BaseToolbar.Button>
      <BaseToolbar.Button onClick={onClear}>Clear</BaseToolbar.Button>
      <Field.Root className="toggle">
        <Checkbox.Root
          className="checkbox"
          checked={lintEnabled}
          onCheckedChange={(checked) => onToggleLint(checked)}
        >
          <Checkbox.Indicator className="checkbox-mark">✓</Checkbox.Indicator>
        </Checkbox.Root>
        <Field.Label className="toggle-label">Lint (recommended preset)</Field.Label>
      </Field.Root>
      <BaseToolbar.Link
        className="spec-link"
        href="https://www.designtokens.org/tr/2025.10/format/"
        target="_blank"
        rel="noreferrer"
      >
        Format spec 2025.10
      </BaseToolbar.Link>
    </BaseToolbar.Root>
  );
}
