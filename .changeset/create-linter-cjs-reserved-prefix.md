---
"open-design-tokens": minor
---

Replace `lintDtcg(input, config, options)` with `createLinter(config)`, which resolves the config once and returns `{ lint, config }`. Configuration mistakes now throw when the linter is created rather than on the first document, and the resolved rules (with merged options) are readable from `linter.config`. `LintOptions` and the custom-rule loader are removed; a namespaced plugin contract is on the roadmap.

Ship a CommonJS build next to the ESM one, with top-level `main` and `types` fields and `require` conditions, so the package resolves under `moduleResolution: node` and in CommonJS test runners.

Add the `name.reserved-prefix` error: a `$`-prefixed group member that holds an object is a token or group whose name begins with `$`, which §5.1.1 forbids. A `$`-prefixed scalar is still reported as `group.property.unknown` (warning).
