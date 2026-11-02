import type { LintIssue, ValidationIssue } from 'open-design-tokens';
import type { PositionIndex } from '../lib/positions.js';

export interface Row {
  issue: ValidationIssue | LintIssue;
  source: 'validator' | 'linter';
}

interface Props {
  rows: Row[];
  positions: PositionIndex;
  onSelect(offset: number, length: number): void;
}

export function IssueList({ rows, positions, onSelect }: Props) {
  if (rows.length === 0) return null;
  return (
    <ul className="issues">
      {rows.map(({ issue, source }) => {
        const pos = positions.locate(issue.path.pointer);
        const where = pos ? `${pos.line}:${pos.column}` : '';
        const id = 'ruleId' in issue ? issue.ruleId : issue.code;
        return (
          <li
            key={`${source}|${issue.path.pointer}|${issue.code}|${issue.message}`}
            className="issue"
          >
            <button
              type="button"
              className="issue-button"
              onClick={() => pos && onSelect(pos.offset, pos.length)}
              title={pos ? 'Select in editor' : 'Position unknown'}
            >
              <span className={`badge badge-${issue.severity}`}>{issue.severity}</span>
              {source === 'linter' ? <span className="badge badge-lint">lint</span> : null}
              <code className="where">{where}</code>
              <code className="path">{issue.path.dot || '(root)'}</code>
              <span className="message">{issue.message}</span>
              <code className="code">{id}</code>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
