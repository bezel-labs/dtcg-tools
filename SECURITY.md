# Security policy

## Supported versions

The latest minor release receives security fixes.

## Reporting a vulnerability

Please do not open a public issue for security problems. Report them privately through GitHub's vulnerability reporting form: https://github.com/bezel-labs/open-design-tokens/security/advisories/new You will receive an acknowledgement within 5 working days and a resolution or status update within 90 days.

## Scope

This library parses untrusted design token files. Reports of the following are especially welcome:

- Prototype pollution or any mutation of global objects from a token file
- Unbounded CPU or memory from crafted input (deep nesting, long alias chains, pathological regular expressions)
- Reference resolution that reaches outside the document
- Diagnostic output that can inject terminal escape sequences or GitHub workflow commands
- Anything in the published tarball that is not built from this repository

See `docs/security.md` for the threat model and the controls already in place.
