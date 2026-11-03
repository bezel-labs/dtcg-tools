#!/usr/bin/env node
/**
 * Generates the reference pages that must stay in sync with the package:
 * issue codes (from the message catalog), lint rules (from rule metadata), and
 * the spec coverage table (from docs/spec-coverage.md). Runs before `next build`.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const repo = `${here}../../../`;
const out = `${here}../content/docs/reference/`;
mkdirSync(out, { recursive: true });

const { DEFAULT_SEVERITY, ISSUE_CODES, MESSAGES } = await import(
  pathToFileURL(`${repo}packages/open-design-tokens/dist/validator.js`).href
);
const { rules, recommended } = await import(
  pathToFileURL(`${repo}packages/open-design-tokens/dist/linter.js`).href
);

/** Escapes text for an MDX table cell: backslashes first, then pipes, newlines, and the characters MDX reads as JSX or expressions. */
const esc = (s) =>
  String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}');
/** Escapes MDX-significant characters outside inline code spans, backslashes first. */
const escMdx = (md) =>
  md
    .split(/(`[^`]*`)/g)
    .map((part, i) =>
      i % 2
        ? part
        : part
            .replace(/\\/g, '\\\\')
            .replace(/</g, '&lt;')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}'),
    )
    .join('');

// Issue codes: render each message with placeholder meta so the shape is visible.
const sample = new Proxy(
  {},
  {
    get: (_, k) =>
      k === 'allowed' || k === 'known' || k === 'names' || k === 'chain' ? ['…'] : `<${String(k)}>`,
  },
);
let codes = `---\ntitle: Issue codes\ndescription: Every code the validator can report, its default severity, and its message.\n---\n\nGenerated from the message catalog of the installed package. Codes are public API; message wording is not.\n\n`;
const bySection = new Map();
for (const code of ISSUE_CODES) {
  const section = code.split('.')[0];
  if (!bySection.has(section)) bySection.set(section, []);
  bySection.get(section).push(code);
}
for (const [section, list] of bySection) {
  codes += `## ${section}\n\n| Code | Severity | Message |\n|---|---|---|\n`;
  for (const code of list) {
    let message;
    try {
      message = MESSAGES[code](sample);
    } catch {
      message = '';
    }
    codes += `| \`${code}\` | ${DEFAULT_SEVERITY[code]} | ${esc(message)} |\n`;
  }
  codes += '\n';
}
writeFileSync(`${out}issue-codes.mdx`, codes);

// Lint rules
const inPreset = new Set(
  Object.keys(recommended.rules ?? {}).filter((id) => recommended.rules[id] !== 'off'),
);
let rulesMd = `---\ntitle: Lint rules\ndescription: Every built-in rule with its options, default severity, and preset membership.\n---\n\nGenerated from the rule metadata of the installed package. Configure a rule with \`"error"\`, \`"warning"\`, \`"off"\`, or \`[severity, options]\`.\n\n| Rule | Default severity | Recommended | Default options | Checks |\n|---|---|:-:|---|---|\n`;
for (const rule of Object.values(rules)) {
  const opts =
    rule.meta.defaultOptions === undefined
      ? ''
      : `\`${esc(JSON.stringify(rule.meta.defaultOptions))}\``;
  rulesMd += `| \`${rule.id}\` | ${rule.meta.defaultSeverity} | ${inPreset.has(rule.id) ? '✔' : ''} | ${opts} | ${esc(rule.meta.description)} |\n`;
}
rulesMd += `\nSee [Linting](/guides/linting) for configuration and [Writing custom rules](/guides/custom-rules) for the rule API.\n`;
writeFileSync(`${out}lint-rules.mdx`, rulesMd);

// Spec coverage: reuse the repo-level generated document.
const coverage = escMdx(
  readFileSync(`${repo}docs/spec-coverage.md`, 'utf8').replace(/^# Spec coverage\n/, ''),
);
writeFileSync(
  `${out}spec-coverage.mdx`,
  `---\ntitle: Spec coverage table\ndescription: Fixture counts per specification section, and the known spec issues.\n---\n${coverage.replace(/^Generated from .*\n/m, '')}`,
);

console.log(
  `generated ${ISSUE_CODES.length} issue codes, ${Object.keys(rules).length} rules, spec coverage`,
);
