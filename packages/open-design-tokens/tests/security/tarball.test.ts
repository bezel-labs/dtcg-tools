import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PKG = fileURLToPath(new URL('../../', import.meta.url));

/** What ships to npm is an allowlist: dist, package.json, README, LICENSE. Nothing else. */
describe('tarball contents', () => {
  it('npm pack includes only allowed files', () => {
    const r = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: PKG,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    expect(r.status).toBe(0);
    const [info] = JSON.parse(r.stdout) as { files: { path: string }[] }[];
    const files = (info?.files ?? []).map((f) => f.path);
    expect(files.length).toBeGreaterThan(5);
    const disallowed = files.filter(
      (f) => !/^(dist\/[^/]+\.(js|d\.ts|js\.map)|package\.json|README\.md|LICENSE)$/.test(f),
    );
    expect(disallowed).toEqual([]);
    expect(files.some((f) => f.includes('.map'))).toBe(true);
  });
});
