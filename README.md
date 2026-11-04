# Open Design Tokens

TypeScript toolkit for validating and linting DTCG design tokens.

[![npm](https://img.shields.io/npm/v/open-design-tokens.svg)](https://www.npmjs.com/package/open-design-tokens)
[![CI](https://github.com/bezel-labs/open-design-tokens/actions/workflows/ci.yml/badge.svg)](https://github.com/bezel-labs/open-design-tokens/actions/workflows/ci.yml)
[![spec 2025.10](https://img.shields.io/badge/DTCG-2025.10-blue.svg)](https://www.designtokens.org/tr/2025.10/format/)
[![types included](https://img.shields.io/badge/types-included-blue.svg)](https://opendesigntokens.com/api/)
[![validator size](https://deno.bundlejs.com/badge?q=open-design-tokens/validator)](https://bundlejs.com/?q=open-design-tokens/validator)
[![license: MIT](https://img.shields.io/npm/l/open-design-tokens.svg)](LICENSE)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/bezel-labs/open-design-tokens/badge)](https://securityscorecards.dev/viewer/?uri=github.com/bezel-labs/open-design-tokens)
[![OpenSSF Best Practices](https://www.bestpractices.dev/projects/16302/badge)](https://www.bestpractices.dev/projects/16302)

Try it in the [playground](https://opendesigntokens.com/), and read the [documentation](https://opendesigntokens.com/docs/).

<table>
  <tr>
    <td align="center" width="25%">
      <h2>Fast</h2>
      Validates 10,000 tokens in ~20 ms.<br>
      <a href="docs/benchmarks.md">Benchmarks</a>
    </td>
    <td align="center" width="25%">
      <h2>Secure</h2>
      Hardened against malicious token files.<br>
      <a href="docs/security.md">Threat model</a>
    </td>
    <td align="center" width="25%">
      <h2>Small</h2>
      12.8 kB gzipped, <strong>zero dependencies</strong>.<br>
      <a href="https://bundlejs.com/?q=open-design-tokens/validator">Bundle size</a>
    </td>
    <td align="center" width="25%">
      <h2>W3C</h2>
      DTCG 2025.10, ready for future specs.<br>
      <a href="docs/spec-coverage.md">Spec coverage</a>
    </td>
  </tr>
</table>

Supports the [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/) and the [Color Module 2025.10](https://www.designtokens.org/tr/2025.10/color/). Zero runtime dependencies. Runs in Node 20.19+, evergreen browsers, and any modern bundler.

**Status: beta.** Feature-complete for the 2025.10 specifications and tested against the spec text; the API will stay on 0.x until it has seen real-world use.

## Install

```sh
npm install open-design-tokens
```

## Validate a file

```js
import { validateDtcg } from 'open-design-tokens/validator';
import { readFileSync } from 'node:fs';

const result = validateDtcg(readFileSync('tokens.json', 'utf8'));

if (!result.valid) {
  for (const issue of result.errors) {
    console.log(`${issue.path.dot}: ${issue.message} [${issue.code}]`);
  }
}
```

With types:

```ts
import { validateDtcg, type ValidationIssue } from 'open-design-tokens/validator';
import type { DesignTokens } from 'open-design-tokens/types';

const tokens: DesignTokens = {
  color: {
    $type: 'color',
    primary: { $value: { colorSpace: 'srgb', components: [0.2, 0.4, 1] } },
  },
};

const { valid, issues }: { valid: boolean; issues: ValidationIssue[] } = validateDtcg(tokens);
```

Sample output for a file with a mis-cased color space and a missing unit:

```
color.brand.primary.$value.colorSpace: Unsupported color space "sRGB". Supported: "srgb", "srgb-linear", "hsl", … Did you mean "srgb"? Values are case-sensitive. [color.color-space.invalid]
spacing.small.$value: A dimension value must have a "unit" property, even when "value" is 0. [dimension.unit.missing]
```

Every issue carries a stable `code`, a plain-text `message`, a `severity`, and a `path` as both a JSON pointer and a dotted path. Invalid input of any shape produces diagnostics; `validateDtcg` never throws on a document.

## Validator or linter?

The validator checks the specification. The linter checks your project's policies. Neither contains vendor-specific rules.

|                           | Validator                                                    | Linter                                              |
| ------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| Question                  | "Is this valid DTCG?"                                        | "Does this follow our policies?"                    |
| Rules                     | Defined by the supported specification version               | Configured by you                                   |
| Examples                  | Invalid value type, missing alias target, circular reference | Name length, naming style, required descriptions    |
| Can the rules be changed? | Not while claiming the same DTCG conformance                 | Yes: enable, disable, configure, or change severity |

A token named `x` is valid DTCG. A project that requires names of 2 to 20 characters configures `token-name-length` as an error, and its CI rejects the file. The rejection means "not accepted by this project", not "invalid DTCG".

`lintDtcg()` always validates first and skips policy rules on nodes with spec errors, so one spec mistake never cascades into misleading lint findings.

## Lint

```ts
import { lintDtcg, defineConfig } from 'open-design-tokens/linter';

const config = defineConfig({
  extends: ['recommended'],
  rules: {
    'token-name-length': ['error', { min: 2, max: 40 }],
    'naming-convention': ['error', { tokens: 'kebab', groups: 'camel' }],
    'no-unused-tokens': ['warning', { ignore: ['component.**'] }],
  },
});

const result = lintDtcg(tokens, config);
result.valid; // spec-valid and no lint errors
result.validation; // the full validation result
result.issues; // lint findings, each with a ruleId
result.skipped; // rule checks skipped on invalid nodes
```

### Command line

```sh
npx dtcg-lint 'src/**/*.tokens.json'
npx dtcg-lint tokens.json --config lint.config.json --format github
```

`dtcg-lint` validates, then lints. It loads `dtcg-lint.config.{json,mjs,js,ts}` from the current directory only, or the file given with `--config`. Formats: `pretty` (default), `json`, `github` (workflow annotations). Exit codes: 0 clean, 1 errors, 2 usage or configuration problem.

### Rules

Each rule takes `"error"`, `"warning"`, `"off"`, or `[severity, options]`. The `recommended` preset enables the rules marked ✔, all as warnings.

| Rule                         | Options                                                                 |  ✔  | Checks                                           |
| ---------------------------- | ----------------------------------------------------------------------- | :-: | ------------------------------------------------ |
| `token-name-length`          | `{ min, max }`                                                          |     | Token names within a length range                |
| `group-name-length`          | `{ min, max }`                                                          |     | Group names within a length range                |
| `description-length`         | `{ min, max }`                                                          |     | `$description` within a length range             |
| `naming-convention`          | `{ tokens, groups }`: `kebab`, `camel`, `pascal`, `snake`, or a pattern |     | Names follow a style                             |
| `require-description`        |                                                                         |     | Every token has a `$description`                 |
| `require-explicit-type`      |                                                                         |     | Every token declares its own `$type`             |
| `max-alias-depth`            | `{ max }`                                                               |  ✔  | Alias chains resolve within `max` hops           |
| `no-unused-tokens`           | `{ ignore: [patterns] }`                                                |  ✔  | Every token is referenced, except ignored layers |
| `no-deprecated-alias`        |                                                                         |  ✔  | No alias points at a deprecated token            |
| `no-empty-groups`            |                                                                         |  ✔  | Groups contain at least one member               |
| `extensions-allowed-vendors` | `{ vendors: [keys] }`                                                   |     | Only listed vendor keys in `$extensions`         |
| `extensions-schema`          | `{ vendors: { key: schema or function } }`                              |     | Vendor blocks match a declared shape             |

Custom rules use `defineRule` and are passed through `lintDtcg(tokens, config, { rules: [myRule] })`.

## Entry points

| Import                         | Contents                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `open-design-tokens/validator` | `validateDtcg`, composable `validate*` functions, `prepareDocument`, resolver, spec tables, messages |
| `open-design-tokens/linter`    | `lintDtcg`, `defineConfig`, `defineRule`, `rules`, presets, formatters                               |
| `open-design-tokens/types`     | All TypeScript types, no runtime code                                                                |
| `open-design-tokens`           | Everything above                                                                                     |

The package is ESM. Node 20.19+ and 22.12+ can `require()` it as well. Guides and concepts are at [opendesigntokens.com/docs](https://opendesigntokens.com/docs/); the generated API reference is at [/api/](https://opendesigntokens.com/api/).

## Spec coverage and known issues

Every normative section of both specifications is covered by fixtures derived from the spec text; see [docs/spec-coverage.md](docs/spec-coverage.md).

The 2025.10 specifications contain a few examples that contradict their own normative rules, for example a `$type` of `"string"` that no section defines, a `%` dimension unit, and typography values that omit a required sub-value. This toolkit follows the rules, not the examples: those examples are kept as expected-failure test cases and listed, with the codes emitted, under [Known spec issues](docs/spec-coverage.md#known-spec-issues). Decisions on genuinely ambiguous points are recorded in [docs/spec-decisions.md](docs/spec-decisions.md).

Not supported yet: the Resolver module. See [ROADMAP.md](ROADMAP.md).

## Security

Token files are treated as untrusted input: no code evaluation, bounded nesting, cycle-safe resolution, document-local references only, escaped diagnostics, and zero runtime dependencies. Details in [docs/security.md](docs/security.md); report vulnerabilities as described in [SECURITY.md](SECURITY.md).

## Questions and ideas

Ask questions in [Q&A](https://github.com/bezel-labs/open-design-tokens/discussions/categories/q-a) and share ideas in [Ideas](https://github.com/bezel-labs/open-design-tokens/discussions/categories/ideas) on GitHub Discussions. Use [issues](https://github.com/bezel-labs/open-design-tokens/issues) for bugs and spec mismatches.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Versioning and the public API policy are in [docs/versioning.md](docs/versioning.md).

## License

MIT
