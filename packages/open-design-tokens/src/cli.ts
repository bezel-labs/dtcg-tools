#!/usr/bin/env node
/**
 * `dtcg-lint`: validates DTCG token files against the specification, then lints them.
 *
 *   dtcg-lint <files or globs...> [--config <path>] [--format pretty|json|github] [--no-color]
 *
 * Exit codes: 0 no errors, 1 errors found, 2 usage or configuration problem.
 */
import { readFileSync } from 'node:fs';
import { relative, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { resolveConfig } from './linter/config.js';
import { lintDtcg } from './linter/engine.js';
import { FORMATTERS, type FormatName } from './linter/formatters/index.js';
import { expandFiles } from './linter/node/files.js';
import { loadConfig } from './linter/node/load-config.js';

const USAGE = `Usage: dtcg-lint <files...> [options]

Validates DTCG token files against the specification, then lints them with your config.

Options:
  --config <path>     Lint config (dtcg-lint.config.{json,mjs,js,ts}); defaults to one in the current directory
  --format <name>     pretty (default), json, or github
  --no-color          Disable ANSI colors in pretty output
  -h, --help          Show this help
`;

async function main(argv: readonly string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    // Enables `--no-color` (Node 20.16+ / 22.4+; engines require 20.19+).
    allowNegative: true,
    options: {
      config: { type: 'string' },
      format: { type: 'string', default: 'pretty' },
      color: { type: 'boolean', default: true },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });
  if (values.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  if (positionals.length === 0) {
    process.stderr.write(USAGE);
    return 2;
  }
  const format = values.format as FormatName;
  const formatter = FORMATTERS[format];
  if (!formatter) {
    process.stderr.write(`Unknown format: ${values.format}. Use pretty, json, or github.\n`);
    return 2;
  }
  const cwd = process.cwd();
  const color = values.color && !process.env.NO_COLOR && (process.stdout.isTTY ?? false);

  let resolved: ReturnType<typeof resolveConfig>;
  try {
    const loaded = await loadConfig(cwd, values.config);
    resolved = resolveConfig(loaded.config);
  } catch (err) {
    process.stderr.write(
      `Configuration error: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return 2;
  }

  const files = expandFiles(positionals, cwd);
  if (files.length === 0) {
    process.stderr.write('No files matched.\n');
    return 2;
  }

  let failed = false;
  const outputs: string[] = [];
  for (const file of files) {
    let source: string;
    try {
      source = readFileSync(file, 'utf8');
    } catch (err) {
      process.stderr.write(
        `Cannot read ${file}: ${err instanceof Error ? err.message : String(err)}\n`,
      );
      failed = true;
      continue;
    }
    const result = lintDtcg(source, {}, { resolved });
    if (!result.valid) failed = true;
    const shown = (relative(cwd, file) || file).split(sep).join('/');
    outputs.push(formatter(result, { file: shown, color }));
  }
  process.stdout.write(
    format === 'json' && files.length > 1
      ? `[${outputs.map((o) => o.trim()).join(',\n')}]\n`
      : outputs.join(''),
  );
  return failed ? 1 : 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`${err instanceof Error ? (err.stack ?? err.message) : String(err)}\n`);
    process.exit(2);
  },
);
