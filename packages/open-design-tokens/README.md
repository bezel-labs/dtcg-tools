# Open Design Tokens

TypeScript toolkit for validating and linting DTCG design tokens.

Supports the Design Tokens Format Module 2025.10 and the Color Module 2025.10. Zero runtime dependencies. Node 20.19+, evergreen browsers, any modern bundler.

**Status: beta.** The validator covers every normative section of both specifications and is tested against the spec text; the public API is stable in shape but will stay on 0.x until it has seen real-world use. Report problems at the repository.

```sh
npm install open-design-tokens
```

```js
import { validateDtcg } from 'open-design-tokens/validator';

const result = validateDtcg(tokens);
for (const issue of result.errors) {
  console.log(`${issue.path.dot}: ${issue.message} [${issue.code}]`);
}
```

```sh
npx dtcg-lint 'tokens/**/*.json' --format github
```

- Documentation: https://opendesigntokens.com/docs/
- Playground: https://opendesigntokens.com/
- API reference: https://opendesigntokens.com/api/
- Source: https://github.com/bezel-labs/open-design-tokens

Entry points: `open-design-tokens/validator`, `open-design-tokens/linter`, `open-design-tokens/types`, and the root which re-exports all.

MIT
