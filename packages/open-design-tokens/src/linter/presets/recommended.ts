import type { LintConfig } from '../types.js';

/**
 * Sensible warnings for any project: no length limits, no naming style, no
 * vendor restrictions. Everything here is a warning so adopting the preset
 * never breaks a build.
 */
export const recommended: LintConfig = {
  rules: {
    'require-explicit-type': 'off',
    'require-description': 'off',
    'no-empty-groups': 'warning',
    'no-unused-tokens': 'warning',
    'no-deprecated-alias': 'warning',
    'alias-max-depth': ['warning', { max: 5 }],
  },
};
