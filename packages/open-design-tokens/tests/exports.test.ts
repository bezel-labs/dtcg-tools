import { describe, expect, it } from 'vitest';
import * as root from '../src/index.js';
import * as linter from '../src/linter/index.js';
import * as validator from '../src/validator/index.js';

/**
 * Public API snapshot: every exported runtime name per entry. A removal here is
 * a breaking change and must be reviewed deliberately.
 */
describe('public exports', () => {
  it('validator entry', () => {
    expect(Object.keys(validator).sort()).toMatchSnapshot();
  });
  it('linter entry', () => {
    expect(Object.keys(linter).sort()).toMatchSnapshot();
  });
  it('root re-exports validator and linter', () => {
    for (const key of [...Object.keys(validator), ...Object.keys(linter)]) {
      expect(root).toHaveProperty(key);
    }
  });
});
