# Contributing

Thanks for helping make Open Design Tokens better. This guide covers setup, the repo layout, and how to add the most common kinds of change.

## Setup

```sh
git clone https://github.com/bezel-labs/open-design-tokens.git
cd open-design-tokens
npm ci
npx turbo run lint typecheck test build
npm run dev   # playground at http://localhost:5173
```

Requirements: Node 20.19 or newer and npm 10.

## Repository map

| Path                                        | What lives there                                                                                                            |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `packages/open-design-tokens/src/core`      | Issue model, limits, JSON pointer helpers, document preparation. Shared by validator and linter.                            |
| `packages/open-design-tokens/src/validator` | Spec checks only. `specs/2025.10/` holds constants, messages, types, value validators, composites, aliases, groups, tokens. |
| `packages/open-design-tokens/src/linter`    | Configurable policy rules, presets, formatters, config loading, CLI support.                                                |
| `packages/open-design-tokens/tests`         | Unit, fixture, security, style, and CLI tests.                                                                              |
| `fixtures/2025.10`                          | Spec-derived fixtures and `manifest.json`; `lint/` holds per-rule pass/fail cases; `samples/` holds the playground files.   |
| `apps/demo`                                 | The playground (Vite + React). `src/examples.ts` holds the per-validator examples.                                          |
| `scripts`                                   | Maintenance scripts such as the spec-coverage generator.                                                                    |
| `docs`                                      | Generated and hand-written documentation.                                                                                   |

## Scope

In scope: validating and linting DTCG Format Module and Color Module files, the types that describe them, and tooling that helps CI and editors use that validation.

Out of scope for now: token transformation or code generation, the Resolver module, design-tool plugins, and network features of any kind. Open an issue first if you are unsure.

## The validator / linter boundary

The validator reports only what the specification says. It has no options beyond the spec version, and its rules cannot be changed while claiming conformance. Anything configurable is a lint rule. Tests enforce this: the validator must never import the linter, and lint rules must never emit a validator issue code.

## How to add things

### A fixture

1. Put the JSON under `fixtures/2025.10/<section>/<kind>-<slug>.json`. Kinds are `basic` (verbatim spec example), `advanced` (built from the prose), and `invalid`.
2. For `invalid`, add a sibling `.expected.json` listing every issue as `{ code, pointer, severity }`. The runner asserts the list exactly, so over-reporting fails.
3. Add a manifest entry with `spec`, `section`, `anchor`, `kind`, and `verbatim`. Spec examples that break the spec's own rules get `source: "spec-example"` and a `notes` explanation.
4. Run `npm run spec-coverage` to regenerate `docs/spec-coverage.md`.

### A validator check

1. Add the issue code to `IssueCode`, a message to `MESSAGES`, and a severity to `DEFAULT_SEVERITY` in `specs/2025.10/messages.ts`. Codes follow `<section>.<field>.<problem>`. Severity is set by the spec: MUST violations are errors.
2. Implement the check next to its neighbours (`values/`, `composites/`, `tokens/`, `groups/`, `aliases/`) as a plain function returning `ValidationIssue[]`. Use `formatValue()` for any user value in a message.
3. Add at least one invalid fixture that exercises the new code; the coverage test fails if a code has no fixture.
4. Add a loadable example to `apps/demo/src/examples.ts`; a test asserts it reports exactly the codes it claims.

### A lint rule

1. Create `src/linter/rules/<rule-id>.ts` with `defineRule`, give it `meta.description`, a default severity, and `validateOptions` if it takes options.
2. Register it in `src/linter/rules/index.ts` and, if it suits every project, in `presets/recommended.ts` as a warning.
3. Add `fixtures/2025.10/lint/<rule-id>/` with `config.json`, `pass.json`, `fail.json`, and `fail.expected.json`.
4. Document it in the README rule table; the docs site's rule reference is generated from the rule metadata.

### A message or wording change

Messages are plain text and are part of the public surface users see in CI logs. Keep them one sentence, name the property in quotes, and put user values through `formatValue()`.

## Code style

Functional TypeScript: plain functions over plain data, no classes, state in closure factories. Biome formats and lints everything (`npm run check`). Commit messages follow Conventional Commits and are checked by a hook.

## Pull requests

Each PR needs a changeset (`npx changeset`) unless it only touches docs, tests, or the playground. The PR template is the review checklist.

## Security

Token files are untrusted input. See `docs/security.md` for the threat model before changing parsing, resolution, or formatters. Report vulnerabilities privately as described in `SECURITY.md`.
