import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EXAMPLE_GROUPS } from '../src/examples.js';
import { PlaygroundPage } from '../src/pages/playground-page.js';

describe('playground', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const panel = (name: string) =>
    within(document.querySelector(`.tab-panel-${name}`) as HTMLElement);

  const settle = () => act(() => vi.advanceTimersByTime(200));

  it('names the page in its h1 and marks its header link as current', () => {
    render(<PlaygroundPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Playground' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Playground' }).getAttribute('aria-current')).toBe(
      'page',
    );
  });

  describe('responsive panels', () => {
    const element = (name: string) => document.querySelector(`.tab-panel-${name}`) as HTMLElement;
    const selected = () =>
      screen.getByRole('tab', { selected: true }).textContent?.replace(/ .*/, '');

    it('starts on the editor tab', () => {
      render(<PlaygroundPage />);
      expect(selected()).toBe('Editor');
    });

    it('leaves hiding to CSS, so wide screens can show every panel', () => {
      render(<PlaygroundPage />);
      for (const name of ['examples', 'editor', 'results']) {
        expect(element(name).hasAttribute('hidden')).toBe(false);
        expect(element(name).hasAttribute('inert')).toBe(false);
      }
      const active = (name: string) => element(name).classList.contains('tab-panel-active');
      expect(active('editor')).toBe(true);
      expect(active('examples')).toBe(false);
      fireEvent.click(screen.getByRole('tab', { name: 'Examples' }));
      expect(active('examples')).toBe(true);
      expect(active('editor')).toBe(false);
    });

    it('goes to the editor after loading an example', () => {
      render(<PlaygroundPage />);
      fireEvent.click(screen.getByRole('tab', { name: 'Examples' }));
      const emptyDocument = screen.getByText('Empty document').closest('li') as HTMLElement;
      fireEvent.click(within(emptyDocument).getByRole('button', { name: 'Load', hidden: true }));
      expect(selected()).toBe('Editor');
      expect((screen.getByLabelText('tokens.json') as HTMLTextAreaElement).value).toBe('{}');
    });

    it('goes to the editor and selects the text when an issue is chosen', () => {
      render(<PlaygroundPage />);
      fireEvent.click(panel('editor').getByRole('button', { name: 'Invalid sample' }));
      settle();
      fireEvent.click(screen.getByRole('tab', { name: /^Results/ }));
      const [row] = panel('results').getAllByRole('listitem');
      fireEvent.click(within(row as HTMLElement).getByRole('button'));
      expect(selected()).toBe('Editor');
      const editor = screen.getByLabelText('tokens.json') as HTMLTextAreaElement;
      expect(document.activeElement).toBe(editor);
      expect(editor.selectionEnd).toBeGreaterThan(editor.selectionStart);
    });

    it('labels only the editor with tokens.json, not the lint checkbox', () => {
      render(<PlaygroundPage />);
      expect(screen.getByLabelText('tokens.json').tagName).toBe('TEXTAREA');
      expect(panel('editor').getByRole('checkbox', { name: /^Lint/ })).toBeTruthy();
    });

    it('toggles the lint checkbox once per click', () => {
      render(<PlaygroundPage />);
      const box = panel('editor').getByRole('checkbox');
      fireEvent.click(box);
      expect(box.getAttribute('aria-checked')).toBe('true');
      fireEvent.click(box);
      expect(box.getAttribute('aria-checked')).toBe('false');
    });

    it('shows the verdict on the results tab', () => {
      render(<PlaygroundPage />);
      settle();
      expect(screen.getByRole('tab', { name: 'Results OK' })).toBeTruthy();
      fireEvent.click(panel('editor').getByRole('button', { name: 'Invalid sample' }));
      settle();
      expect(screen.getByRole('tab', { name: /^Results \d+$/ })).toBeTruthy();
    });

    it('stops long lines widening a scroll panel', () => {
      render(<PlaygroundPage />);
      const content = document.querySelector('.scroll-panel [role="presentation"]') as HTMLElement;
      expect(content.style.minWidth).toMatch(/^0/);
    });
  });

  describe('example groups', () => {
    const trigger = (title: string) =>
      screen.getByRole('button', { name: new RegExp(`^${title}`) });
    const isOpen = (title: string) => trigger(title).getAttribute('aria-expanded') === 'true';

    it('keeps one group open at a time, and can close them all', () => {
      render(<PlaygroundPage />);
      expect(isOpen('Full project')).toBe(true);

      fireEvent.click(trigger('Groups'));
      expect(isOpen('Groups')).toBe(true);
      expect(isOpen('Full project')).toBe(false);

      fireEvent.click(trigger('Groups'));
      expect(isOpen('Groups')).toBe(false);
      expect(isOpen('Full project')).toBe(false);
    });

    it('keeps closed groups findable by browser search', () => {
      render(<PlaygroundPage />);
      const panel = screen.getByText('Root is not an object').closest('.area-panel');
      expect(panel?.getAttribute('hidden')).toBe('until-found');
    });
  });

  it('lists Full project first, then the example groups in spec section order', () => {
    const [first, ...rest] = EXAMPLE_GROUPS;
    expect(first?.area).toBe('Full project');
    const sections = rest.map((group) => /§([\d.]+)/.exec(group.spec)?.[1] ?? '');
    const sorted = [...sections].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    expect(sections).toEqual(sorted);
  });

  it('marks each example valid or invalid from the validator result', () => {
    render(<PlaygroundPage />);
    const pill = (title: string) =>
      screen.getByText(title).closest('li')?.querySelector('.pill')?.textContent;
    expect(pill('Empty document')).toBe('Valid');
    expect(pill('Root is not an object')).toBe('Invalid');
    // Lists a code in `expect`, but it is only a warning.
    expect(pill('Unknown $-property')).toBe('Valid');
  });

  it('validates the default sample as valid', () => {
    render(<PlaygroundPage />);
    settle();
    expect(screen.getByRole('status').textContent).toContain('Valid');
  });

  it('loads the invalid sample and shows issues with positions', () => {
    render(<PlaygroundPage />);
    settle();
    fireEvent.click(panel('editor').getByRole('button', { name: 'Invalid sample' }));
    settle();
    expect(screen.getByRole('status').textContent).toContain('Invalid');
    const rows = panel('results').getAllByRole('listitem');
    expect(rows.length).toBeGreaterThan(40);
    const first = within(rows[0] as HTMLElement);
    expect(first.getByText(/^\d+:\d+$/)).toBeTruthy();
  });

  it('reports a parse error for broken JSON and formats valid JSON', () => {
    render(<PlaygroundPage />);
    const editor = screen.getByLabelText('tokens.json') as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: '{ "a": ' } });
    settle();
    expect(panel('results').getByText(/document\.invalid-json/)).toBeTruthy();
    fireEvent.change(editor, { target: { value: '{"a":{"$type":"number","$value":1}}' } });
    fireEvent.click(panel('editor').getByRole('button', { name: 'Format JSON' }));
    expect(editor.value).toContain('\n  "a": {');
  });

  it('adds lint findings when the lint toggle is on', () => {
    render(<PlaygroundPage />);
    const editor = screen.getByLabelText('tokens.json') as HTMLTextAreaElement;
    fireEvent.change(editor, {
      target: { value: '{"a":{"$type":"number","$value":1},"empty":{}}' },
    });
    fireEvent.click(panel('editor').getByRole('checkbox'));
    settle();
    expect(panel('results').getByText(/no-empty-groups/)).toBeTruthy();
    expect(panel('results').getByText('Validation and lint results')).toBeTruthy();
  });
});
