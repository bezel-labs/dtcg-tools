#!/usr/bin/env node
/**
 * `dtcg-lint` command-line interface. Implemented in Milestone 7.
 */
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: { help: { type: 'boolean', short: 'h' } },
  strict: false,
});

if (values.help) {
  process.stdout.write(
    'Usage: dtcg-lint <files...> [--config <path>] [--format pretty|json|github]\n',
  );
  process.exit(0);
}

process.stderr.write('dtcg-lint is not implemented yet.\n');
process.exit(2);
