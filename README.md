# <p align="center">Open Design Tokens</p>

<p align="center"><strong>Check a design token file with one command:</strong></p>

```sh
npx -p open-design-tokens dtcg-lint tokens.json
```

<p align="center"><strong>A free, open-source TypeScript toolkit for validating and linting DTCG design tokens.</strong></p>

<p align="center">
  <a href="https://www.npmjs.com/package/open-design-tokens"><img src="https://img.shields.io/npm/v/open-design-tokens?style=for-the-badge&label=npm&logo=npm&logoColor=white&color=CB3837" alt="npm" /></a>
  <a href="https://github.com/bezel-labs/open-design-tokens/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/bezel-labs/open-design-tokens/ci.yml?style=for-the-badge&label=CI" alt="CI Status" /></a>
  <a href="https://www.designtokens.org/tr/2025.10/format/"><img src="https://img.shields.io/badge/DTCG-2025.10-blue?style=for-the-badge" alt="DTCG spec 2025.10" /></a>
  <a href="https://opendesigntokens.com/api/"><img src="https://img.shields.io/badge/types-included-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="Types included" /></a>
  <a href="https://bundlejs.com/?q=open-design-tokens/validator"><img src="https://img.shields.io/bundlejs/size/open-design-tokens/validator?style=for-the-badge&label=validator%20size" alt="Validator size" /></a>
  <a href="https://github.com/bezel-labs/open-design-tokens/blob/main/LICENSE"><img src="https://img.shields.io/github/license/bezel-labs/open-design-tokens?style=for-the-badge&label=License" alt="License" /></a>
  <a href="https://securityscorecards.dev/viewer/?uri=github.com/bezel-labs/open-design-tokens"><img src="https://img.shields.io/ossf-scorecard/github.com/bezel-labs/open-design-tokens?style=for-the-badge&label=OpenSSF%20Scorecard" alt="OpenSSF Scorecard" /></a>
  <a href="https://www.bestpractices.dev/projects/16302"><img src="https://img.shields.io/cii/level/16302?style=for-the-badge&label=OpenSSF%20Best%20Practices" alt="OpenSSF Best Practices" /></a>
</p>

<p align="center">Try it in the <a href="https://opendesigntokens.com/">playground</a>, and read the <a href="https://opendesigntokens.com/docs/">documentation</a>.</p>

A token file goes in and a clear answer comes out: is it valid DTCG, and does it follow your project's policies? Open Design Tokens supports the [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/) and the [Color Module 2025.10](https://www.designtokens.org/tr/2025.10/color/), and runs in Node 20.19+, evergreen browsers, and any modern bundler.

**100% free** for personal and commercial use, under the MIT license.

**Project status.** Open Design Tokens is in beta. It is feature-complete for the 2025.10 specifications and tested against the spec text. The API will stay on 0.x until it has seen real-world use, so expect occasional breaking changes. Bug reports are welcome: [open an issue](https://github.com/bezel-labs/open-design-tokens/issues).

## Core Features

- Validate token files against DTCG 2025.10, with every normative section covered by fixtures derived from the spec text ([spec coverage](docs/spec-coverage.md)). Ready for future specs.
- Lint against your project's policies with 12 built-in rules, each with its own severity and options.
- Get diagnostics with a stable code, a plain-text message, a severity, and both a JSON pointer and a dotted path.
- Validate 10,000 tokens in ~20 ms ([benchmarks](docs/benchmarks.md)).
- Ship 12.8 kB gzipped with zero runtime dependencies ([bundle size](https://bundlejs.com/?q=open-design-tokens/validator)).
- Handle untrusted files safely, hardened against malicious token files ([threat model](docs/security.md)).
- Run in CI from the command line, with pretty, JSON, or GitHub workflow annotation output.
- Import from ESM or CommonJS, with TypeScript types included.

## Installation

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

A linter always validates first and skips policy rules on nodes with spec errors, so one spec mistake never cascades into misleading lint findings.

## Lint

```ts
import { createLinter, defineConfig } from 'open-design-tokens/linter';

const config = defineConfig({
  extends: ['recommended'],
  rules: {
    'token-name-length': ['error', { min: 2, max: 40 }],
    'naming-convention': ['error', { tokens: 'kebab', groups: 'camel' }],
    'no-unused-tokens': ['warning', { ignore: ['component.**'] }],
  },
});

const linter = createLinter(config); // resolves the config once; throws here if it is wrong
const result = linter.lint(tokens); // reuse `linter` for every document
result.valid; // spec-valid and no lint errors
result.validation; // the full validation result
result.issues; // lint findings, each with a ruleId
result.skipped; // rule checks skipped on invalid nodes
```

### Command-line interface

Open Design Tokens ships a CLI for scripts and CI. Once the package is installed:

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

Loading rules from outside the package is not supported yet; see the [roadmap](ROADMAP.md).

## Entry points

| Import                         | Contents                                                                                             |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `open-design-tokens/validator` | `validateDtcg`, composable `validate*` functions, `prepareDocument`, resolver, spec tables, messages |
| `open-design-tokens/linter`    | `createLinter`, `defineConfig`, `rules`, presets, formatters                                         |
| `open-design-tokens/types`     | All TypeScript types, no runtime code                                                                |
| `open-design-tokens`           | Everything above                                                                                     |

The package ships ESM and CommonJS builds, so both `import` and `require()` work. Guides and concepts are at [opendesigntokens.com/docs](https://opendesigntokens.com/docs/); the generated API reference is at [/api/](https://opendesigntokens.com/api/).

## Spec coverage and known issues

Every normative section of both specifications is covered by fixtures derived from the spec text; see [docs/spec-coverage.md](docs/spec-coverage.md).

> [!NOTE]
> **A spec example fails validation?** The 2025.10 specifications contain a few examples that contradict their own normative rules, for example a `$type` of `"string"` that no section defines, a `%` dimension unit, and typography values that omit a required sub-value. This toolkit follows the rules, not the examples: those examples are kept as expected-failure test cases and listed, with the codes emitted, under [Known spec issues](docs/spec-coverage.md#known-spec-issues).

Decisions on genuinely ambiguous points are recorded in [docs/spec-decisions.md](docs/spec-decisions.md).

The Resolver module is not supported yet. See the [roadmap](ROADMAP.md).

## Security

Token files are treated as untrusted input: no code evaluation, bounded nesting, cycle-safe resolution, document-local references only, escaped diagnostics, and zero runtime dependencies. Details in [docs/security.md](docs/security.md); report vulnerabilities as described in [SECURITY.md](SECURITY.md).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Versioning and the public API policy are in [docs/versioning.md](docs/versioning.md).

## Community

If you need help, want to report a bug, or have an idea:

- 💬 **[Q&A](https://github.com/bezel-labs/open-design-tokens/discussions/categories/q-a)**: ask questions on GitHub Discussions
- 💡 **[Ideas](https://github.com/bezel-labs/open-design-tokens/discussions/categories/ideas)**: share ideas on GitHub Discussions
- 🐞 **[GitHub Issues](https://github.com/bezel-labs/open-design-tokens/issues)**: bugs and spec mismatches
- 🗺️ **[Roadmap](ROADMAP.md)**: see what's planned next

---

## License

This project is licensed under the [MIT License](LICENSE).
