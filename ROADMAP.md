# Roadmap

Items are added when there is an actual need.

## Message localisation

`validateDtcg(json, { locale })` and `createLinter(config, { locale })` selecting a message catalog. The English catalog becomes `en`; additional locales ship as `open-design-tokens/locales/<lang>` so only the requested one loads. Every message is already keyed by issue code, so this is additive.

## Lint plugins

Rules from outside the package. A plugin is an object any package can export, `{ name, rules, presets? }`, loaded from a JavaScript or TypeScript config through a `plugins` array. Rule ids are namespaced by the plugin name (`name/rule`), presets are referenced as `name/preset` in `extends`, and `resolveConfig` rejects a plugin whose name collides with a built-in rule. The rule-author types (`LintRule`, `LintContext`, `RuleVisitor`, `NodeInfo`, `Resolver`) become public API at that point. Deferred until a real need appears; shipping no custom-rule loading today means there are no flat custom ids to migrate later.

## MCP server

A Model Context Protocol (MCP) server that gives AI coding agents `validate` and `lint` tools for design token files, with the same diagnostics as the library and CLI. It runs locally over stdio, reads only the files or text it is given, and makes no network requests. It ships as a separate package so the core package keeps zero runtime dependencies.

## Documentation improvements

Improve the [documentation site](https://opendesigntokens.com/docs/) with clearer guides, more worked examples, and better coverage of the validator, linter, and CLI.
