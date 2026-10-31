# DTCG Tools

A design token validator and TypeScript toolkit for the DTCG specification, with composable validators, exported types, alias resolution, and helpful utilities planned.

Planned npm package: `@bezel-labs/dtcg-tools`.

**Status: initial scaffold.** The validator, exported types, tests, and React demo are not implemented yet. This package is not published to npm, and the package name has not been reserved. `private: true` prevents accidental publication until the package is ready.

## Planned scope

- A primary `validateDtcg()` function composed from individually exportable validators.
- Exported TypeScript types for documents, token values, validation options, and results.
- Plain TypeScript implementation with no Zod dependency.
- Versioned implementation under `src/specs/format-20251028/`, targeting Format Module 2025.10 and its corresponding Color Module.
- DTCG compliance rules separated from optional application policies.
- Structured issues with stable codes, JSON Pointer paths, descriptive messages, and centralized message templates.
- Optional configurable length and resource limits; `-1` represents an unlimited maximum.
- Shared JSON fixtures organized by specification section.
- A client-side React demo with validation errors on the left and JSON input on the right.

## Initialization TODO

- [x] Create a standalone public repository in bezel-labs.
- [x] Add package metadata and an MIT license.
- [ ] Configure TypeScript, library build, Vitest, and linting.
- [ ] Define the public API, composable types, options, and error format.
- [ ] Implement `validateDtcg()` and JSON text validation.
- [ ] Implement design token, group, root token, name, and metadata validators.
- [ ] Implement value validators for color, dimension, fontFamily, fontWeight, duration, cubicBezier, number, strokeStyle, border, transition, shadow, gradient, and typography.
- [ ] Implement aliases, JSON Pointer references, chained references, group extensions, type inheritance, and circular reference detection.
- [ ] Export predicates such as `isAlias()`, `isRootToken()`, and `aliasTokenExists()`.
- [ ] Add optional export-name, variant-name, and application policy validators.
- [ ] Add JSON safety checks, deterministic errors, and configurable resource limits.
- [ ] Record exact official JSON examples with source attribution and applicable notices.
- [ ] Add advanced valid fixtures and intentionally invalid fixtures with expected issue codes and paths.
- [ ] Create a section-by-section specification coverage manifest and passing unit tests for both valid and invalid examples.
- [ ] Configure tree-shakable runtime exports and type-only imports.
- [ ] Build the React demo and shared fixture selector.
- [ ] Add CI for type checking, tests, and builds.
- [ ] Add `.github/workflows/deploy.yml` for demo deployment to GitHub Pages.
- [ ] Configure the optional custom domain `validator.bezel.new`.
- [ ] Verify npm naming availability and prepare the first release.
- [ ] Evaluate separate Resolver Module support in a later release.

## Planned structure

- `src/` — validator library and exported types.
- `src/specs/format-20251028/` — version-specific validators, reference handling, helpers, and messages.
- `fixtures/format-20251028/` — official, advanced, and invalid examples grouped by specification section.
- `tests/format-20251028/` — conformance and behavior tests.
- `demo/` — React validation playground.
- `.github/workflows/` — CI and demo deployment.

These directories will be added as implementation begins.

## Specification and fixtures

Primary reference: [DTCG Format Module 2025.10](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/).

Official examples should be preserved exactly when applicable. Examples are non-normative and may illustrate fragments or invalid input; normative requirements determine expected validation results. Invalid fixtures must have passing tests that assert the expected errors.

This is an independent project by Bezel Labs and is not an official W3C or DTCG implementation.

## License

Original project code is licensed under [MIT](LICENSE). Any incorporated third-party specification examples retain their applicable attribution and license notices.
