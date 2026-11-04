---
"open-design-tokens": minor
---

Type each issue's `meta` by its `code` (`IssueMeta`, `SpecIssue`): `ValidationResult.issues` narrows on `code`, so clients can build their own messages or UI from the details without parsing the sentence. Shape errors now carry the offending value as `meta.actual` when it is a primitive, and their messages name it ("received the string "#zzz""); objects and arrays are still described by type only.

Add `messages` to `ValidateOptions` and a second `createLinter(config, { messages })` argument: a partial catalog keyed by code that replaces the wording of those codes and nothing else.
