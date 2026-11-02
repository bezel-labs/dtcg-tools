import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app.js';

describe('playground', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  /** Queries scoped to the editor/results side, not the examples sidebar. */
  const workspace = () => within(document.querySelector('.workspace') as HTMLElement);

  const settle = () => act(() => vi.advanceTimersByTime(200));

  it('validates the default sample as valid', () => {
    render(<App />);
    settle();
    expect(screen.getByRole('status').textContent).toContain('Valid');
  });

  it('loads the invalid sample and shows issues with positions', () => {
    render(<App />);
    settle();
    fireEvent.click(workspace().getByRole('button', { name: 'Invalid sample' }));
    settle();
    expect(screen.getByRole('status').textContent).toContain('Invalid');
    const rows = workspace().getAllByRole('listitem');
    expect(rows.length).toBeGreaterThan(40);
    const first = within(rows[0] as HTMLElement);
    expect(first.getByText(/^\d+:\d+$/)).toBeTruthy();
  });

  it('reports a parse error for broken JSON and formats valid JSON', () => {
    render(<App />);
    const editor = screen.getByLabelText('tokens.json') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: '{ "a": ' } });
    settle();
    expect(workspace().getByText(/document\.invalid-json/)).toBeTruthy();
    fireEvent.change(editor, { target: { value: '{"a":{"$type":"number","$value":1}}' } });
    fireEvent.click(workspace().getByRole('button', { name: 'Format JSON' }));
    expect(editor.value).toContain('\n  "a": {');
  });

  it('adds lint findings when the lint toggle is on', () => {
    render(<App />);
    const editor = screen.getByLabelText('tokens.json') as HTMLTextAreaElement;
    fireEvent.change(editor, {
      target: { value: '{"a":{"$type":"number","$value":1},"empty":{}}' },
    });
    fireEvent.click(workspace().getByRole('checkbox'));
    settle();
    expect(workspace().getByText(/no-empty-groups/)).toBeTruthy();
    expect(workspace().getByText('Validation and lint results')).toBeTruthy();
  });
});
