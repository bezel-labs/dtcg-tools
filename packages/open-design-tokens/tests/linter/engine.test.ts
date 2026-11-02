import { describe, expect, it } from 'vitest';
import { defineRule, lintDtcg, resolveConfig } from '../../src/linter/index.js';
import { ISSUE_CODES, validateDtcg } from '../../src/validator/index.js';

describe('lint engine', () => {
  it('always validates first and gates rules on invalid nodes', () => {
    const doc = { bad: { $type: 'number', $value: 'x' }, ok: { $type: 'number', $value: 1 } };
    const r = lintDtcg(doc, { rules: { 'require-description': 'error' } });
    expect(r.valid).toBe(false);
    expect(r.validation.errors.map((i) => i.code)).toEqual(['number.value.not-number']);
    expect(r.issues.map((i) => i.path.pointer)).toEqual(['/ok']);
    expect(r.skipped).toEqual([
      { ruleId: 'require-description', pointer: '/bad', reason: 'node has validation errors' },
    ]);
  });

  it('valid means spec-valid and no lint errors; warnings do not fail', () => {
    const doc = { t: { $type: 'number', $value: 1 } };
    expect(lintDtcg(doc, { rules: { 'require-description': 'warning' } }).valid).toBe(true);
    expect(lintDtcg(doc, { rules: { 'require-description': 'error' } }).valid).toBe(false);
  });

  it('validation output is identical with and without a lint config', () => {
    const doc = { a: { $type: 'number', $value: 'x' }, b: { $value: '{a}' }, c: {} };
    const plain = validateDtcg(doc);
    const linted = lintDtcg(doc, {
      extends: ['recommended'],
      rules: { 'token-name-length': ['error', { min: 3 }] },
    }).validation;
    expect(linted).toEqual(plain);
  });

  it('never emits a validator issue code from a rule', () => {
    const doc = { a: { $type: 'number', $value: 1 }, g: {} };
    const r = lintDtcg(doc, {
      extends: ['recommended'],
      rules: {
        'require-description': 'error',
        'require-explicit-type': 'error',
        'naming-convention': ['error', { tokens: 'pascal' }],
      },
    });
    const validatorCodes = new Set<string>(ISSUE_CODES);
    for (const i of r.issues) expect(validatorCodes.has(i.code), i.code).toBe(false);
  });

  it('does not run rules on unparsable or non-object input', () => {
    expect(lintDtcg('{', { rules: { 'require-description': 'error' } }).issues).toEqual([]);
    expect(lintDtcg([], { rules: { 'require-description': 'error' } }).issues).toEqual([]);
  });

  it('presets apply first and explicit rules override', () => {
    const resolved = resolveConfig({
      extends: ['recommended'],
      rules: { 'no-empty-groups': 'off', 'max-alias-depth': ['error', { max: 1 }] },
    });
    const byId = Object.fromEntries(resolved.rules.map((r) => [r.rule.id, r]));
    expect(byId['no-empty-groups']).toBeUndefined();
    expect(byId['max-alias-depth']?.severity).toBe('error');
    expect(byId['max-alias-depth']?.options).toEqual({ max: 1 });
    expect(byId['no-unused-tokens']?.severity).toBe('warning');
  });

  it('rejects unknown rules, bad severities, and malformed options', () => {
    expect(() => resolveConfig({ rules: { nope: 'error' } })).toThrow(/Unknown lint rule/);
    // @ts-expect-error deliberate
    expect(() => resolveConfig({ rules: { 'no-empty-groups': 'loud' } })).toThrow(/severity/);
    expect(() =>
      resolveConfig({ rules: { 'token-name-length': ['error', { min: 'x' }] } }),
    ).toThrow(/min must be/);
    expect(() =>
      resolveConfig({ rules: { 'naming-convention': ['error', { tokens: '(' }] } }),
    ).toThrow(/tokens:/);
  });

  it('supports custom rules and prefixes their codes', () => {
    const rule = defineRule<undefined>({
      id: 'no-foo',
      meta: { description: 'no token named foo', defaultSeverity: 'error' },
      create(ctx) {
        return {
          token(node) {
            if (node.path.at(-1) === 'foo')
              ctx.report({ code: 'found', message: 'nope\u001b[31m', path: node.path });
          },
        };
      },
    });
    const r = lintDtcg(
      { foo: { $type: 'number', $value: 1 } },
      { rules: { 'no-foo': 'error' } },
      { rules: [rule] },
    );
    expect(r.issues[0]?.code).toBe('no-foo.found');
    expect(r.issues[0]?.ruleId).toBe('no-foo');
    expect(r.issues[0]?.message).toBe('nope\\u001b[31m');
  });
});
