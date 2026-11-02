# Versioning and public API policy

Open Design Tokens follows [Semantic Versioning](https://semver.org/). Releases are produced with [changesets](https://github.com/changesets/changesets); every pull request that changes behaviour adds a changeset describing the bump.

## What is public API

The following are covered by the SemVer guarantee:

- The package entry points: `open-design-tokens`, `/validator`, `/linter`, `/types`.
- Every runtime export and exported type of those entry points, by name and signature.
- Issue codes (`color.component.out-of-range` and so on), their severities, and the `path` of each issue.
- Lint rule ids, their option shapes, and the rules in the `recommended` preset.
- The `dtcg-lint` command, its flags, output formats, and exit codes.
- The `ValidationResult` and `LintResult` shapes.

Not covered:

- The wording of messages. Messages are for humans; match on `code` in tooling.
- The order of issues beyond "document order, stable across runs".
- Anything exported with an `unstable_` prefix or marked `@experimental` in its JSDoc.
- File paths inside `dist/`; import only through the entry points.

## Bumps

- **Patch**: bug fixes, new fixtures, message wording, performance.
- **Minor**: new exports, new issue codes, new lint rules, new rule options, new CLI flags, and support for a new specification version.
- **Major**: removing or renaming any public API, changing an issue's code, path, or severity, changing a rule's default options, or dropping a Node major.

Adding an issue code is a minor bump even though it can turn a previously valid document invalid: the validator reports what the specification says, and a new code means a spec rule was previously unchecked.

## Deprecation

A public export is deprecated for at least one minor release before removal. Deprecated exports carry an `@deprecated` JSDoc tag naming the replacement, and the CHANGELOG lists them. Removal happens in the next major.

## Specification versions

Each supported specification version lives in its own module (`specs/2025.10/`) and is selected with the `spec` option. Adding a version is a minor bump; the default stays on the previous version until the next major so existing users are not moved without opting in.

## Migration notes

Every major release ships `docs/migrations/<version>.md` with before/after examples for each breaking change.
