import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../src/app.js';
import { EXAMPLE_GROUPS } from '../src/examples.js';

describe('playground', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  /** Queries scoped to the editor/results side, not the examples sidebar. */
  const workspace = () => within(document.querySelector('.workspace') as HTMLElement);

  const settle = () => act(() => vi.advanceTimersByTime(200));

  it('names the h1 with readable text, not the ASCII logo', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Open Design Tokens');
    expect(screen.getByRole('heading', { level: 1, name: /^Open Design Tokens/ })).toBeTruthy();
  });

  it('keeps one example group open at a time', () => {
    render(<App />);
    const area = (title: string) =>
      screen.getByText(title).closest('details') as HTMLDetailsElement;
    const toggle = (el: HTMLDetailsElement) => fireEvent(el, new Event('toggle'));
    const fullProject = area('Full project');
    const groups = area('Groups');
    expect(fullProject.open).toBe(true);

    // The browser opens the clicked group and fires its toggle event.
    groups.open = true;
    toggle(groups);
    expect(fullProject.open).toBe(false);

    // The group React just closed fires its own toggle, which must not clear the new one.
    toggle(fullProject);
    expect(groups.open).toBe(true);
    expect(fullProject.open).toBe(false);

    // Clicking the open group closes it, leaving none open.
    groups.open = false;
    toggle(groups);
    expect(groups.open).toBe(false);
    expect(fullProject.open).toBe(false);
  });

  it('lists Full project first, then the example groups in spec section order', () => {
    const [first, ...rest] = EXAMPLE_GROUPS;
    expect(first?.area).toBe('Full project');
    const sections = rest.map((group) => /§([\d.]+)/.exec(group.spec)?.[1] ?? '');
    const sorted = [...sections].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    expect(sections).toEqual(sorted);
  });

  it('marks each example valid or invalid from the validator result', () => {
    render(<App />);
    const pill = (title: string) =>
      screen.getByText(title).closest('li')?.querySelector('.pill')?.textContent;
    expect(pill('Empty document')).toBe('Valid');
    expect(pill('Root is not an object')).toBe('Invalid');
    // Lists a code in `expect`, but it is only a warning.
    expect(pill('Unknown $-property')).toBe('Valid');
  });

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
