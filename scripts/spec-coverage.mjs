#!/usr/bin/env node
/**
 * Generates docs/spec-coverage.md from fixtures/2025.10/manifest.json:
 * a coverage table per spec section and the list of spec examples that the
 * validator rejects because they contradict the spec's own normative rules.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const manifest = JSON.parse(readFileSync(`${root}fixtures/2025.10/manifest.json`, 'utf8'));
const SPEC_URL = {
  format: 'https://www.designtokens.org/tr/2025.10/format/',
  color: 'https://www.designtokens.org/tr/2025.10/color/',
};

const sections = new Map();
for (const e of manifest) {
  const key = `${e.spec}:${e.anchor}`;
  const s = sections.get(key) ?? {
    spec: e.spec,
    anchor: e.anchor,
    section: e.section,
    basic: 0,
    advanced: 0,
    invalid: 0,
  };
  s[e.kind] += 1;
  sections.set(key, s);
}
const sorted = [...sections.values()].sort((a, b) =>
  a.spec === b.spec
    ? a.section.localeCompare(b.section, undefined, { numeric: true })
    : a.spec.localeCompare(b.spec),
);

const known = manifest.filter((e) => e.source === 'spec-example');
const codesFor = (e) => {
  try {
    const exp = JSON.parse(readFileSync(`${root}fixtures/2025.10/${e.expected}`, 'utf8'));
    return [...new Set(exp.issues.map((i) => i.code))].join(', ');
  } catch {
    return '';
  }
};

let md = `# Spec coverage\n\nGenerated from \`fixtures/2025.10/manifest.json\` by \`scripts/spec-coverage.mjs\`. Do not edit by hand.\n\n`;
md += `Fixtures: ${manifest.length} (${manifest.filter((e) => e.kind === 'basic').length} basic, ${manifest.filter((e) => e.kind === 'advanced').length} advanced, ${manifest.filter((e) => e.kind === 'invalid').length} invalid). `;
md += `Verbatim spec examples: ${manifest.filter((e) => e.example && e.verbatim).length}; cleaned (comments or trailing commas removed): ${manifest.filter((e) => e.example && !e.verbatim).length}.\n\n`;
md += `## Sections\n\n| Spec | Section | Basic | Advanced | Invalid |\n|---|---|---:|---:|---:|\n`;
for (const s of sorted) {
  md += `| ${s.spec} | [${s.section}](${SPEC_URL[s.spec]}#${s.anchor}) | ${s.basic} | ${s.advanced} | ${s.invalid} |\n`;
}
md += `\n## Known spec issues\n\nThese examples appear in the 2025.10 specifications but contradict the specifications' own normative rules, or are incomplete snippets. They are kept as expected-failure fixtures rather than as valid examples.\n\n| Spec | Example | Section | Codes emitted | Why |\n|---|---:|---|---|---|\n`;
for (const e of known.sort((a, b) => a.spec.localeCompare(b.spec) || a.example - b.example)) {
  md += `| ${e.spec} | ${e.example} | [${e.section}](${SPEC_URL[e.spec]}#${e.anchor}) | \`${codesFor(e)}\` | ${e.notes ?? ''} |\n`;
}
writeFileSync(`${root}docs/spec-coverage.md`, md);
console.log(`docs/spec-coverage.md: ${sorted.length} sections, ${known.length} known spec issues`);
