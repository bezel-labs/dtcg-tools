import type { ValidationIssue } from '../../../../core/issue.js';
import { isAlias, isReference } from '../../../../core/predicates.js';
import type { NodeInfo } from '../../../../core/prepare.js';
import { prepareDocument } from '../../../../core/prepare.js';
import type { ValidationContext } from '../../../context.js';
import { createIssue } from '../../../context.js';
import type { TokenType } from '../types/token.js';
import { parseAlias } from './parse.js';
import { createResolver, type Resolver } from './resolver.js';

export interface AliasCheck {
  issues: ValidationIssue[];
  /** Type of the concrete token at the end of the chain, when it resolved. */
  resolvedType: TokenType | undefined;
  resolved: boolean;
}

/**
 * Validates the alias token at `pointer` in a document: alias syntax, target
 * existence and kind, cycles, and type compatibility with `expectedType` (or
 * the token's own or inherited type when omitted).
 *
 * @example
 * ```ts
 * const check = validateAliasToken(tokens, '/semantic/primary');
 * check.resolved; // true when the chain ends at a concrete token
 * ```
 */
export function validateAliasToken(
  input: unknown,
  pointer: string,
  expectedType?: TokenType,
): AliasCheck {
  const doc = prepareDocument(input);
  const node = doc.index.get(pointer);
  const segments = pointer === '' ? [] : pointer.slice(1).split('/');
  if (!node || node.kind === 'group') {
    const ctx: ValidationContext = { spec: doc.spec, path: segments };
    return {
      issues: [createIssue(ctx, 'alias.target.missing', { alias: pointer, path: pointer })],
      resolvedType: undefined,
      resolved: false,
    };
  }
  const resolver = createResolver(doc);
  const type = expectedType ?? resolver.effectiveType(node);
  const ctx: ValidationContext = {
    spec: doc.spec,
    path: [...node.path, node.kind === 'reference' ? '$ref' : '$value'],
  };
  return checkAliasToken(node, type, resolver, ctx);
}

/**
 * Internal form used by the token validator: the alias token's `$value` (or a
 * reference node's `$ref`) is checked with a resolver and context already in hand.
 */
export function checkAliasToken(
  node: NodeInfo,
  expectedType: TokenType | undefined,
  resolver: Resolver,
  ctx: ValidationContext,
): AliasCheck {
  const issues: ValidationIssue[] = [];
  const raw = node.raw;
  const ref: unknown = node.kind === 'reference' ? raw.$ref : raw.$value;
  const isCurly = typeof ref === 'string' && isAlias(ref);
  const refString = isCurly
    ? (ref as string)
    : node.kind === 'reference'
      ? (ref as string)
      : isReference(ref)
        ? ref.$ref
        : undefined;
  const actual = refString ?? ref;

  if (isCurly && !parseAlias(ref as string)) {
    issues.push(createIssue(ctx, 'alias.syntax.invalid', { actual }));
    return { issues, resolvedType: undefined, resolved: false };
  }

  const res = resolver.resolveAlias(node.pointer);
  const missingCode = isCurly ? 'alias.target.missing' : 'ref.target.missing';
  switch (res.status) {
    case 'ok':
      break;
    case 'cycle':
      issues.push(createIssue(ctx, isCurly ? 'alias.cycle' : 'ref.cycle', { chain: res.chain }));
      return { issues, resolvedType: undefined, resolved: false };
    case 'missing':
      issues.push(createIssue(ctx, missingCode, { alias: actual, actual, path: res.path }));
      return { issues, resolvedType: undefined, resolved: false };
    case 'not-token':
      issues.push(
        isCurly
          ? createIssue(ctx, 'alias.target.not-token', {
              alias: actual,
              path: res.path.slice(1).split('/').join('.'),
            })
          : createIssue(ctx, 'ref.target.missing', { actual, path: res.path }),
      );
      return { issues, resolvedType: undefined, resolved: false };
    case 'not-local':
      issues.push(createIssue(ctx, 'ref.not-local', { actual }));
      return { issues, resolvedType: undefined, resolved: false };
    case 'malformed':
      issues.push(
        createIssue(ctx, isCurly ? 'alias.syntax.invalid' : 'ref.syntax.invalid', { actual }),
      );
      return { issues, resolvedType: undefined, resolved: false };
    default:
      return { issues, resolvedType: undefined, resolved: false };
  }

  const target = res.target as NodeInfo;
  if (target.pointer === node.pointer) {
    // A `$ref` to a sub-value fragment: the consumer validates the fragment.
    return { issues, resolvedType: expectedType, resolved: true };
  }
  const targetType = resolver.effectiveType(target);
  if (expectedType !== undefined && targetType !== undefined && expectedType !== targetType) {
    issues.push(
      createIssue(ctx, isCurly ? 'alias.type.mismatch' : 'ref.type.mismatch', {
        alias: actual,
        actual: targetType,
        actualType: targetType,
        expected: expectedType,
        target: target.pointer,
      }),
    );
  }
  return { issues, resolvedType: targetType, resolved: true };
}
