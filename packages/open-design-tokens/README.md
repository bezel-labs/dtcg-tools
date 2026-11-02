# Open Design Tokens

TypeScript toolkit for validating and linting DTCG design tokens.

Supports the Design Tokens Format Module 2025.10 and the Color Module 2025.10.

```sh
npm install open-design-tokens
```

```ts
import { validateDtcg } from 'open-design-tokens/validator';

const result = validateDtcg(tokens);
if (!result.valid) {
  for (const issue of result.errors) {
    console.log(`${issue.path.dot}: ${issue.message} (${issue.code})`);
  }
}
```

Entry points: `open-design-tokens/validator`, `open-design-tokens/linter`, `open-design-tokens/types`, and the root which re-exports all.

In development. See the repository for progress.
