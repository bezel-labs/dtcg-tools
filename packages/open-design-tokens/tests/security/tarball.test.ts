import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PKG = fileURLToPath(new URL('../../', import.meta.url));

/**
 * What ships to npm is an allowlist: dist, package.json, README, LICENSE.
 * Nothing else. Skipped on Windows, where spawning npm through cmd.exe does
 * not return clean JSON on every Node version; the Tarball workflow covers
 * the same allowlist against a real install on Linux for Node 20, 22, and 24.
 */
describe('tarball contents', () => {
  it.skipIf(process.platform === 'win32')('npm pack includes only allowed files', () => {
    const r = spawnSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: PKG,
      encoding: 'utf8',
    });
    expect(r.status, r.stderr).toBe(0);
    // npm may print warnings before the JSON; take the array that starts at the first "[".
    const json = r.stdout.slice(r.stdout.indexOf('['));
    const [info] = JSON.parse(json) as { files: { path: string }[] }[];
    const files = (info?.files ?? []).map((f) => f.path);
    expect(files.length).toBeGreaterThan(5);
    const disallowed = files.filter(
      (f) =>
        !/^(dist\/[^/]+\.(js|cjs|d\.ts|d\.cts|js\.map|cjs\.map)|package\.json|README\.md|LICENSE)$/.test(
          f,
        ),
    );
    expect(disallowed).toEqual([]);
    expect(files.some((f) => f.includes('.map'))).toBe(true);
  });
});
