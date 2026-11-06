# <p align="center">Open Design Tokens</p>

<p align="center"><img src="assets/logo.svg" alt="Open Design Tokens" width="100%" /></p>

<p align="center"><strong>Check a design token file with one command</strong></p>

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

Design tokens store colors, spacing, typography, and other design decisions as data that tools can share. The [Design Tokens Community Group](https://www.designtokens.org/) (DTCG) defines a standard JSON format for them. Open Design Tokens tells you whether a file follows that format and your project's own policies. It's free and MIT licensed.

- ✅ Checks every normative section of the [Format](https://www.designtokens.org/tr/2025.10/format/) and [Color](https://www.designtokens.org/tr/2025.10/color/) 2025.10 specifications ([coverage](docs/spec-coverage.md))
- 🧹 Lints against your policies with [12 configurable rules](https://opendesigntokens.com/docs/reference/lint-rules/)
- 🤖 Runs in CI with pretty, JSON, or GitHub annotation output
- ⚡ Validates 10,000 tokens in about 20 ms ([benchmarks](docs/benchmarks.md))
- 📦 Validator is about 13 kB gzipped, with zero runtime dependencies
- 🔒 Safe on untrusted files ([threat model](docs/security.md))

**Status: beta.** The specifications are fully covered, but the API stays on 0.x until it has seen real-world use, so expect occasional breaking changes.

## Motivation

Design tokens pass between designers, developers, build tools, and now AI agents. The DTCG specification defines what a valid token file looks like, but not your team's own conventions. Open Design Tokens gives everyone one check for both:

- **The validator asks "is this valid DTCG?"** It works on any W3C DTCG 2025.10 file with no configuration, and reports only what the specification says.
- **The linter asks "does this meet our standards?"** It goes beyond the specification with rules you choose, such as limiting how long alias chains can get, banning aliases to deprecated tokens, or enforcing a naming style.

Designers and developers can confirm a file is sound before it ships. AI agents can run the same command and get errors with stable codes and exact paths, so their edits stay within your team's standards. Writing your own rules is [on the roadmap](ROADMAP.md).

## Quick start

Run it on a file without installing anything:

```sh
npx -p open-design-tokens dtcg-lint tokens.json
```

```
tokens.json
  color.brand.primary.$value.colorSpace error   Unsupported color space "sRGB". Supported: "srgb", "srgb-linear", "hsl", "hwb", "lab", "lch", "oklab", "oklch", "display-p3", "a98-rgb", "prophoto-rgb", "rec2020", "xyz-d65", "xyz-d50". Did you mean "srgb"? Values are case-sensitive.  color.color-space.invalid
  spacing.small.$value             error   A dimension value must have a "unit" property, even when "value" is 0.  dimension.unit.missing

2 errors, 0 warnings
```

Or install it and call it from code. It runs in Node 20.19+, evergreen browsers, and modern bundlers:

```sh
npm install open-design-tokens
```

```js
import { validateDtcg } from 'open-design-tokens/validator';
import { readFileSync } from 'node:fs';

const result = validateDtcg(readFileSync('tokens.json', 'utf8'));

for (const issue of result.errors) {
  console.log(`${issue.path.dot}: ${issue.message} [${issue.code}]`);
}
```

`validateDtcg` never throws on a document: invalid input of any shape comes back as diagnostics. Import from `open-design-tokens/validator`, `/linter`, `/types`, or the package root. ESM and CommonJS are both supported.

## Set your team's standards

A token named `x` is valid DTCG, but a project that requires names of 2 to 40 characters can reject it in CI. Add a `dtcg-lint.config.json` to set your policies:

```json
{
  "extends": ["recommended"],
  "rules": {
    "token-name-length": ["error", { "min": 2, "max": 40 }],
    "naming-convention": ["error", { "tokens": "kebab" }]
  }
}
```

## Run in CI

```yaml
- run: npx --yes -p open-design-tokens dtcg-lint 'tokens/**/*.json' --format github
```

This adds annotations to the pull request and fails the job on errors; warnings alone pass unless you add `--max-warnings <n>` (`0` fails on any warning). See the [CI guide](https://opendesigntokens.com/docs/guides/ci/) for the full workflow.

## Spec support

The 2025.10 specifications include a few examples that break their own rules. This toolkit follows the rules, and those examples are listed under [known spec issues](docs/spec-coverage.md#known-spec-issues). The Resolver module isn't supported yet; see the [roadmap](ROADMAP.md).

This project is built to support future versions of the DTCG specification, including breaking changes. Each version lives in its own module and is selected with the `spec` option, so existing users aren't moved to a new version until they opt in or a new major release changes the default ([versioning policy](docs/versioning.md#specification-versions)). We look forward to working with and supporting the [W3C Design Tokens Community Group](https://www.designtokens.org/).

## Learn more

- [Getting started](https://opendesigntokens.com/docs/getting-started/)
- [Lint rules](https://opendesigntokens.com/docs/reference/lint-rules/) and [issue codes](https://opendesigntokens.com/docs/reference/issue-codes/)
- [CLI reference](https://opendesigntokens.com/docs/reference/cli/) and [API reference](https://opendesigntokens.com/api/)
- [Changelog](packages/open-design-tokens/CHANGELOG.md) and [roadmap](ROADMAP.md)
- [Q&A](https://github.com/bezel-labs/open-design-tokens/discussions/categories/q-a), [ideas](https://github.com/bezel-labs/open-design-tokens/discussions/categories/ideas), and [issues](https://github.com/bezel-labs/open-design-tokens/issues)

## Security

Token files are treated as untrusted input. See the [threat model](docs/security.md), and report vulnerabilities as described in [SECURITY.md](SECURITY.md).

## Contributing

Contributors are welcome, and we look forward to improving Open Design Tokens together with the community. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started, and the [versioning policy](docs/versioning.md) for how releases work.

## License

[MIT](LICENSE)
