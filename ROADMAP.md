# Roadmap

Items are added when there when there is an actual need.

## Message localisation

`validateDtcg(json, { locale })` and `lintDtcg(…, { locale })` selecting a message catalog. The English catalog becomes `en`; additional locales ship as `open-design-tokens/locales/<lang>` so only the requested one loads. Every message is already keyed by issue code, so this is additive.
