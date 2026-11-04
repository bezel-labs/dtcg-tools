# AGENTS.md

Open Design Tokens: a TypeScript validator and linter for DTCG 2025.10 design token files. It is published to npm as `open-design-tokens`.

## Layout

- `packages/open-design-tokens`: the published package (`src/core`, `src/validator`, `src/linter`, `src/cli.ts`).
- `fixtures/2025.10`: spec-derived test fixtures, indexed by `manifest.json`.
- `apps/demo`: the playground (Vite + React), served at opendesigntokens.com.
- `apps/docs`: the docs site (Next.js + Fumadocs, static export), served at `/docs`.

## Commands

```sh
npm ci
npx turbo run lint typecheck test build   # everything CI runs
npm run check                             # Biome lint and format
npm run dev                               # playground
npm run docs:dev                          # docs site
```

## Rules

- **Validator is spec only.** It reports what the specification says and takes no options except the spec version and presentation of messages (`messages` overrides, later locales). Anything that changes *what* is reported is a lint rule. The validator must never import the linter.
- **Token files are untrusted input.** Never use `eval` or `new Function`, never build a `RegExp` from document content, never follow non-local `$ref`, and keep traversal bounded. Pass user values in messages through `formatValue`. Invalid input returns diagnostics and never throws.
- **Functional style.** Use plain functions and data. Do not use classes or `this`. Hold state in closure factories such as `createResolver`.
- **Zero runtime dependencies** in the published package. `node:` imports are allowed only in `cli.ts` and `linter/node/`.
- **Issue codes, rule ids, and exports are public API.** Do not rename or remove them without a major version.
- **Kebab-case** file names. Use **Biome** for linting and formatting, not ESLint or Prettier.
- Keep company or vendor names out of content and examples. Use `com.example.app` for vendor examples.

## Adding a validator check

1. Add the code, message, and severity in `specs/2025.10/messages.ts`.
2. Implement it as a function that returns `ValidationIssue[]`.
3. Add an invalid fixture with an exact `.expected.json`. A test fails if any code is never exercised.
4. Add a loadable example in `apps/demo/src/examples.ts`. A test checks that it reports exactly the codes it claims.

## Changes and releases

- Work on a branch and open a pull request. Pull requests are squash-merged, and the pull request title must follow Conventional Commits (`fix: …`, `feat(linter): …`).
- Add a changeset (`npx changeset`) for any change to the published package. Merging the bot's "Version Packages" pull request publishes to npm through trusted publishing. Never publish by hand.
