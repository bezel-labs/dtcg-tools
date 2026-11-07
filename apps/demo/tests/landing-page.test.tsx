import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LandingPage } from '../src/pages/landing-page.js';

describe('landing page', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('has one h1, and hides the ASCII logo from assistive tech', () => {
    render(<LandingPage />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.querySelector('.hero-logo')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('marks itself as the current page in the shared header', () => {
    render(<LandingPage />);
    const home = screen.getByRole('link', { name: 'Open Design Tokens' });
    expect(home.getAttribute('aria-current')).toBe('page');
  });

  it('sends the hero to the docs and the playground', () => {
    render(<LandingPage />);
    const hero = within(document.querySelector('.hero') as HTMLElement);
    expect(hero.getByRole('link', { name: 'Try the playground' }).getAttribute('href')).toBe(
      '/playground/',
    );
    expect(hero.getByRole('link', { name: 'Get started' }).getAttribute('href')).toBe(
      '/docs/getting-started/',
    );
  });

  it('switches the command with the package runner tab', () => {
    render(<LandingPage />);
    expect(screen.getByText('npx open-design-tokens tokens.json')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'pnpm' }));
    expect(screen.getByText('pnpm dlx open-design-tokens tokens.json')).toBeTruthy();
  });

  it('copies the command', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(<LandingPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });
    expect(writeText).toHaveBeenCalledWith('npx open-design-tokens tokens.json');
    expect(screen.getByRole('button', { name: 'Copied' })).toBeTruthy();
  });

  it('leaves the label alone when the browser refuses to copy', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    render(<LandingPage />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy' }));
    });
    expect(screen.getByRole('button', { name: 'Copy' })).toBeTruthy();
  });

  it('labels each placeholder with the size to make its graphic', () => {
    render(<LandingPage />);
    const hero = screen.getByRole('img', { name: /Hero graphic, 1168 by 480 pixels/ });
    expect(hero.textContent).toContain('1168 × 480');
    expect(hero.style.maxWidth).toBe('1168px');
  });
});

describe('HTML entries', () => {
  const html = (path: string) => readFileSync(resolve(import.meta.dirname, '..', path), 'utf8');
  const csp = (source: string) => /Content-Security-Policy"\s+content="([^"]+)"/.exec(source)?.[1];

  it('gives every page the same Content Security Policy', () => {
    expect(csp(html('index.html'))).toBeTruthy();
    expect(csp(html('playground/index.html'))).toBe(csp(html('index.html')));
  });

  it('pins only the playground to the viewport', () => {
    expect(html('playground/index.html')).toContain('class="fixed-page"');
    expect(html('index.html')).not.toContain('fixed-page');
  });
});
