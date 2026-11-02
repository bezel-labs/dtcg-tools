import { describe, expectTypeOf, it } from 'vitest';
import type { LintConfig, LintIssue, LintResult } from '../../src/linter/index.js';
import type {
  AliasOr,
  ColorValue,
  DesignToken,
  DesignTokens,
  DimensionValue,
  Group,
  IssueCode,
  Severity,
  ShadowValue,
  TokenType,
  TypedToken,
  ValidateOptions,
  ValidationIssue,
  ValidationResult,
  ValueForType,
} from '../../src/types.js';
import { isTokenOfType, validateDtcg } from '../../src/validator/index.js';

describe('public types', () => {
  it('ValueForType maps every $type to its value shape', () => {
    expectTypeOf<ValueForType<'color'>>().toEqualTypeOf<ColorValue>();
    expectTypeOf<ValueForType<'dimension'>>().toEqualTypeOf<DimensionValue>();
    expectTypeOf<ValueForType<'shadow'>>().toEqualTypeOf<ShadowValue>();
    expectTypeOf<ValueForType<'number'>>().toEqualTypeOf<number>();
  });

  it('AliasOr accepts a value, a curly alias, or a $ref', () => {
    expectTypeOf<`{${string}}`>().toMatchTypeOf<AliasOr<ColorValue>>();
    expectTypeOf<{ $ref: string }>().toMatchTypeOf<AliasOr<ColorValue>>();
    expectTypeOf<ColorValue>().toMatchTypeOf<AliasOr<ColorValue>>();
    expectTypeOf<number>().not.toMatchTypeOf<AliasOr<ColorValue>>();
  });

  it('$type narrows a DesignToken', () => {
    const token = {
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [1, 0, 0] },
    } as DesignToken;
    if (isTokenOfType(token, 'color')) {
      expectTypeOf(token).toEqualTypeOf<TypedToken<'color'>>();
      expectTypeOf(token.$value).toEqualTypeOf<AliasOr<ColorValue>>();
    }
    expectTypeOf<TypedToken<'dimension'>['$type']>().toEqualTypeOf<'dimension'>();
  });

  it('groups and documents accept nested tokens and groups', () => {
    const doc: DesignTokens = {
      $description: 'd',
      color: { $type: 'color', primary: { $value: { colorSpace: 'srgb', components: [0, 0, 0] } } },
    };
    expectTypeOf(doc).toMatchTypeOf<Group>();
    expectTypeOf<TokenType>().toEqualTypeOf<
      | 'color'
      | 'dimension'
      | 'fontFamily'
      | 'fontWeight'
      | 'duration'
      | 'cubicBezier'
      | 'number'
      | 'strokeStyle'
      | 'border'
      | 'transition'
      | 'shadow'
      | 'gradient'
      | 'typography'
    >();
  });

  it('validateDtcg options and result', () => {
    expectTypeOf(validateDtcg).parameter(1).toEqualTypeOf<ValidateOptions | undefined>();
    expectTypeOf(validateDtcg).returns.toEqualTypeOf<ValidationResult>();
    expectTypeOf<ValidationResult['issues'][number]>().toEqualTypeOf<ValidationIssue>();
    expectTypeOf<ValidationIssue['severity']>().toEqualTypeOf<Severity>();
    expectTypeOf<ValidateOptions['spec']>().toEqualTypeOf<'2025.10' | undefined>();
    expectTypeOf<IssueCode>().toMatchTypeOf<string>();
  });

  it('lint config and result shapes', () => {
    const config: LintConfig = {
      extends: ['recommended'],
      rules: { 'token-name-length': ['error', { min: 2 }], 'no-empty-groups': 'off' },
    };
    expectTypeOf(config.rules).toEqualTypeOf<LintConfig['rules']>();
    expectTypeOf<LintResult['issues'][number]>().toEqualTypeOf<LintIssue>();
    expectTypeOf<LintIssue['ruleId']>().toEqualTypeOf<string>();
    expectTypeOf<LintResult['validation']>().toEqualTypeOf<ValidationResult>();
  });
});
