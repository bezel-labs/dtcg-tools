# Threat model and controls

## Trust boundaries

| Input              | Trust     | Why                                                                                                                                                                               |
| ------------------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Token documents    | Untrusted | Validated in CI on contributor pull requests, in the public playground, and by services accepting uploads.                                                                        |
| Lint configuration | Trusted   | Written by the project running the linter. A `.js`/`.ts` config executes code, the same as an ESLint or Vite config. Prefer `.json` configs when linting untrusted pull requests. |
| CLI arguments      | Trusted   | Supplied by the operator.                                                                                                                                                         |

## Controls

**Parsing and traversal.** Documents are parsed with `JSON.parse` only. There is no `eval`, `Function`, dynamic import, or `RegExp` built from document content (a style test greps for them). Traversal is iterative with an explicit stack and a hard depth cap (`MAX_DEPTH`), so deep nesting yields `document.too-deep` instead of a stack overflow. Circular object graphs and throwing getters, which can only arrive from non-JSON input, produce diagnostics rather than exceptions.

**Prototype safety.** All internal indexes are `Map`s; property reads use own-property checks; merged `$extends` views use null-prototype objects. Fixtures with `__proto__`, `constructor`, and `prototype` as names assert `Object.prototype` is unchanged.

**References.** `$ref` must start with `#` and resolve inside the document; anything else is `ref.not-local` and is never fetched. Pointer segments are decoded per RFC 6901 and looked up with own-property checks and bounds-checked integer indices. Alias and `$extends` resolution are memoised with cycle detection, so chains cost linear time and cycles are reported, not followed.

**Regular expressions.** Every pattern in `src/` is anchored and free of nested quantifiers. The only `new RegExp` is the naming-convention rule's custom pattern, which comes from trusted config and is bounded in length.

**Messages and output.** User values are rendered through `formatValue()`, which truncates and escapes control characters. The pretty formatter strips ANSI and control characters from names and paths; the GitHub formatter percent-encodes newlines and command delimiters so a token name cannot forge a workflow command.

**CLI.** Only files named on the command line are read; globs never follow symbolic links; config is loaded from an explicit path or the current directory only, never parent directories. Nothing is written.

**Playground.** Static site with a strict Content Security Policy, no inline scripts, no third-party scripts, no network calls, and a 2 MB input cap.

**Supply chain.** Zero runtime dependencies (tested). Lockfile committed and installed with `npm ci --ignore-scripts`. Actions are pinned to commit SHAs with least-privilege permissions. CodeQL runs on every push and pull request. Releases are published through npm trusted publishing with provenance, so each tarball is attestable to a workflow run; the package has no lifecycle scripts and ships only `dist`.

## Error contract

Invalid input of any shape produces diagnostics, never an exception. A property-based test feeds arbitrary JSON values, strings, and exotic objects to `validateDtcg` and `lint`. Exceptions are reserved for programmer errors: an unknown spec version or a malformed lint configuration.
