## Summary

<!-- What changes and why. Link the issue if there is one. -->

## Checklist

- [ ] Fixture added or updated for every new or changed check (with `.expected.json` for invalid cases)
- [ ] Message added to the catalog for every new issue code, with user values passed through `fmt()`
- [ ] Tests pass locally: `npx turbo run lint typecheck test build`
- [ ] Changeset added (`npx changeset`), or this PR touches only docs, tests, or the playground
- [ ] README or docs updated if behaviour or public API changed
- [ ] Playground example added for any new validator check (`apps/demo/src/examples.ts`)
- [ ] No new runtime dependencies; no classes; no `node:` imports outside `cli.ts` and `linter/node/`
