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
    <div className="toolbar" role="toolbar" aria-label="Editor actions">
      <button type="button" onClick={() => onLoad(FULL_PROJECT_JSON)}>
        Valid sample
      </button>
      <button type="button" onClick={() => onLoad(INVALID_PROJECT_JSON)}>
        Invalid sample
      </button>
      <button type="button" onClick={onFormat}>
        Format JSON
      </button>
      <button type="button" onClick={onClear}>
        Clear
      </button>
      <label className="toggle">
        <input
          type="checkbox"
          checked={lintEnabled}
          onChange={(e) => onToggleLint(e.target.checked)}
        />
        Lint (recommended preset)
      </label>
      <a
        className="spec-link"
        href="https://www.designtokens.org/tr/2025.10/format/"
        target="_blank"
        rel="noreferrer"
      >
        Format spec 2025.10
      </a>
    </div>
  );
}
