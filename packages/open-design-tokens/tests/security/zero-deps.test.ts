import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('supply chain', () => {
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

  it('the published package has zero runtime dependencies', () => {
    expect(pkg.dependencies ?? {}).toEqual({});
    expect(pkg.peerDependencies ?? {}).toEqual({});
    expect(pkg.optionalDependencies ?? {}).toEqual({});
  });

  it('has no lifecycle scripts that run on install', () => {
    for (const name of Object.keys(pkg.scripts ?? {})) {
      expect(name).not.toMatch(/^(pre|post)?install$|^prepare$|^prepublish$/);
    }
  });

  it('ships only dist', () => {
    expect(pkg.files).toEqual(['dist']);
  });
});
