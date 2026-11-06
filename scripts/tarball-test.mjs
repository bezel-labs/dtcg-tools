#!/usr/bin/env node
/**
 * Tests what users actually install: packs the package, installs the tarball
 * into a scratch project, imports every subpath with ESM and require(), runs
 * both CLI bins, and bundles the validator for the browser with esbuild
 * and executes it inside a happy-dom window. Exits non-zero on any failure.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const pkgDir = join(root, 'packages', 'open-design-tokens');
const run = (cmd, args, cwd) =>
  execFileSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    shell: process.platform === 'win32',
  });
const fail = (msg) => {
  console.error(`✖ ${msg}`);
  process.exit(1);
};

const packed = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', tmpdir()], pkgDir));
const tgz = join(tmpdir(), packed[0].filename);
const files = packed[0].files.map((f) => f.path);
const allowed = /^(dist\/.*|package\.json|README\.md|LICENSE)$/;
for (const f of files) if (!allowed.test(f)) fail(`unexpected file in tarball: ${f}`);
console.log(`✔ tarball contains ${files.length} allowed files`);

const scratch = mkdtempSync(join(tmpdir(), 'odt-scratch-'));
writeFileSync(
  join(scratch, 'package.json'),
  JSON.stringify({ name: 'scratch', private: true, type: 'module' }),
);
run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tgz], scratch);
console.log('✔ installed from tarball');

const esm = `
import { validateDtcg } from 'open-design-tokens/validator';
import { createLinter } from 'open-design-tokens/linter';
import * as all from 'open-design-tokens';
const r = validateDtcg({ a: { $type: 'number', $value: 1 } });
if (!r.valid) throw new Error('esm validate');
const linter = createLinter({ extends: ['recommended'] });
if (!linter.lint({ a: { $type: 'number', $value: 1 } }).validation.valid) throw new Error('esm lint');
if (typeof all.validateDtcg !== 'function' || typeof all.createLinter !== 'function') throw new Error('esm root');
console.log('✔ esm imports');
`;
writeFileSync(join(scratch, 'esm.mjs'), esm);
run(process.execPath, ['esm.mjs'], scratch);

const cjs = `
const { validateDtcg } = require('open-design-tokens/validator');
const { createLinter } = require('open-design-tokens/linter');
const root = require('open-design-tokens');
if (!validateDtcg({ a: { $type: 'number', $value: 1 } }).valid) throw new Error('cjs validate');
if (!createLinter({ extends: ['recommended'] }).lint({ a: { $type: 'number', $value: 1 } }).valid) throw new Error('cjs lint');
if (root.createLinter !== createLinter) throw new Error('cjs root');
console.log('✔ require() of CommonJS entries');
`;
writeFileSync(join(scratch, 'cjs.cjs'), cjs);
run(process.execPath, ['--no-warnings', 'cjs.cjs'], scratch);

writeFileSync(
  join(scratch, 'tokens.json'),
  JSON.stringify({ a: { $type: 'number', $value: 'x' } }),
);
for (const name of ['open-design-tokens', 'dtcg-lint']) {
  const bin = spawnSync(join(scratch, 'node_modules', '.bin', name), ['tokens.json'], {
    cwd: scratch,
    encoding: 'utf8',
  });
  if (bin.status !== 1 || !bin.stdout.includes('number.value.not-number'))
    fail(`${name} bin: status ${bin.status}\n${bin.stdout}${bin.stderr}`);
  console.log(`✔ ${name} bin runs and exits 1 on errors`);
}

// Browser bundle: esbuild resolves from the scratch project; jsdom executes it.
const esbuild = await import(
  pathToFileURL(join(root, 'node_modules', 'esbuild', 'lib', 'main.js')).href
);
const bundle = await esbuild.build({
  stdin: {
    contents: `import { validateDtcg } from 'open-design-tokens/validator'; globalThis.__result = validateDtcg({ a: { $type: 'number', $value: 1 } }).valid;`,
    resolveDir: scratch,
  },
  bundle: true,
  platform: 'browser',
  format: 'iife',
  write: false,
  logLevel: 'silent',
});
const code = bundle.outputFiles[0].text;
if (/\brequire\(["']node:/.test(code) || /from ["']node:/.test(code))
  fail('browser bundle references node builtins');
const { Window } = await import(
  pathToFileURL(join(root, 'node_modules', 'happy-dom', 'lib', 'index.js')).href
);
const { createContext, runInContext } = await import('node:vm');
const window = new Window({ url: 'https://example.test/' });
const context = createContext(window);
runInContext(code, context);
if (window.__result !== true) fail('browser bundle did not validate in a browser-like window');
await window.happyDOM.close();
console.log(
  `✔ browser bundle (${(code.length / 1024).toFixed(1)} kB) runs in a browser-like window`,
);
console.log(
  readFileSync(join(scratch, 'node_modules', 'open-design-tokens', 'package.json'), 'utf8').match(
    /"version": "[^"]+"/,
  )[0],
);
