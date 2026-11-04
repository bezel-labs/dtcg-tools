# Roadmap

Items are added when there is an actual need.

## Message localisation

`validateDtcg(json, { locale })` and `lintDtcg(…, { locale })` selecting a message catalog. The English catalog becomes `en`; additional locales ship as `open-design-tokens/locales/<lang>` so only the requested one loads. Every message is already keyed by issue code, so this is additive.

## MCP server

A Model Context Protocol (MCP) server that gives AI coding agents `validate` and `lint` tools for design token files, with the same diagnostics as the library and CLI. It runs locally over stdio, reads only the files or text it is given, and makes no network requests. It ships as a separate package so the core package keeps zero runtime dependencies.
