# open-design-tokens

## 0.2.0

### Minor Changes

- [#24](https://github.com/bezel-labs/open-design-tokens/pull/24) [`f21750b`](https://github.com/bezel-labs/open-design-tokens/commit/f21750b30a3ab509091e2bc9b552496bd0f6693d) Thanks [@mr-robot-o](https://github.com/mr-robot-o)! - Replace `lintDtcg(input, config, options)` with `createLinter(config)`, which resolves the config once and returns `{ lint, config }`. Configuration mistakes now throw when the linter is created rather than on the first document, and the resolved rules (with merged options) are readable from `linter.config`. `LintOptions` and the custom-rule loader are removed; a namespaced plugin contract is on the roadmap.
  
  Ship a CommonJS build next to the ESM one, with top-level `main` and `types` fields and `require` conditions, so the package resolves under `moduleResolution: node` and in CommonJS test runners.
  
  Add the `name.reserved-prefix` error: a `$`-prefixed group member that holds an object is a token or group whose name begins with `$`, which §5.1.1 forbids. A `$`-prefixed scalar is still reported as `group.property.unknown` (warning).

## 0.1.1

### Patch Changes

- [`6cabdc1`](https://github.com/bezel-labs/open-design-tokens/commit/6cabdc1e6f95f22a6c4485a28cb11318111e5d3a) Thanks [@mr-robot-o](https://github.com/mr-robot-o)! - Fix `dtcg-lint --no-color`, which exited with an unknown-option error instead of disabling colors.

## 0.1.0

### Minor Changes

- [`6bd2f64`](https://github.com/bezel-labs/open-design-tokens/commit/6bd2f645ed6e111adc14d9e5fe4fe5a8ab4e7438) Thanks [@mr-robot-o](https://github.com/mr-robot-o)! - First functional release: a DTCG 2025.10 validator covering every token type, groups, aliases, JSON pointer references, and group extension; a configurable linter with twelve rules and a recommended preset; the `dtcg-lint` CLI with pretty, JSON, and GitHub formatters; and full TypeScript types.
