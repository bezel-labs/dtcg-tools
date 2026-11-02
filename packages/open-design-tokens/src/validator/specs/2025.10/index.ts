import type { ValidationIssue } from '../../../core/issue.js';
import { MAX_DEPTH } from '../../../core/limits.js';
import { hasOwn, isAliasOrReference, isPlainObject, isToken } from '../../../core/predicates.js';
import type { ValidationContext } from '../../context.js';
import { child, createIssue } from '../../context.js';
import { typeName } from '../../primitives.js';
import type { ValidationStats } from '../../result.js';
import { PRIMITIVE_TOKEN_TYPES } from './constants.js';
import type { PrimitiveTokenType, TokenType } from './types/token.js';
import { PRIMITIVE_VALUE_VALIDATORS } from './values/index.js';

export * from './constants.js';
export * from './messages.js';
export * from './types/index.js';
export * from './values/index.js';

export interface DocumentValidation {
  issues: ValidationIssue[];
  stats: ValidationStats;
}

interface WalkState {
  issues: ValidationIssue[];
  stats: ValidationStats;
  /** Ancestor objects, to detect cycles in non-JSON input. */
  ancestors: WeakSet<object>;
}

function isPrimitiveType(type: unknown): type is PrimitiveTokenType {
  return typeof type === 'string' && (PRIMITIVE_TOKEN_TYPES as readonly string[]).includes(type);
}

/** Reads an own property, turning a throwing getter into a diagnostic. */
function readOwn(
  obj: Record<string, unknown>,
  key: string,
  ctx: ValidationContext,
  state: WalkState,
): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: obj[key] };
  } catch (err) {
    state.issues.push(
      createIssue(child(ctx, key), 'document.unreadable-node', {
        reason: err instanceof Error ? err.message : String(err),
      }),
    );
    return { ok: false };
  }
}

/**
 * Validates one token's `$value` against its resolved type. Token-level checks
 * (names, `$type` validity, reserved properties) arrive in Milestone 3; alias
 * resolution in Milestone 4; composite values in Milestone 5.
 */
function validateTokenValue(
  token: Record<string, unknown> & { $value: unknown },
  ctx: ValidationContext,
  inheritedType: TokenType | undefined,
  state: WalkState,
): void {
  const ownType = hasOwn(token, '$type') ? token.$type : undefined;
  const type = typeof ownType === 'string' ? ownType : inheritedType;
  const value = token.$value;

  if (isAliasOrReference(value)) {
    state.stats.aliases += 1;
    return;
  }
  if (isPrimitiveType(type)) {
    state.issues.push(...PRIMITIVE_VALUE_VALIDATORS[type](value, child(ctx, '$value')));
  }
}

function walkGroup(
  group: Record<string, unknown>,
  ctx: ValidationContext,
  inheritedType: TokenType | undefined,
  depth: number,
  state: WalkState,
): void {
  if (depth > MAX_DEPTH) {
    state.issues.push(createIssue(ctx, 'document.too-deep', { depth }));
    return;
  }
  if (state.ancestors.has(group)) {
    state.issues.push(createIssue(ctx, 'document.circular'));
    return;
  }
  state.ancestors.add(group);

  const groupType =
    hasOwn(group, '$type') && typeof group.$type === 'string'
      ? (group.$type as TokenType)
      : inheritedType;

  for (const key of Object.keys(group)) {
    if (key.startsWith('$')) continue;
    const read = readOwn(group, key, ctx, state);
    if (!read.ok) continue;
    const member = read.value;
    const mctx = child(ctx, key);
    if (isToken(member)) {
      state.stats.tokens += 1;
      validateTokenValue(member, mctx, groupType, state);
    } else if (isPlainObject(member)) {
      state.stats.groups += 1;
      walkGroup(member, mctx, groupType, depth + 1, state);
    }
    // Non-object members are invalid group content; reported in Milestone 3.
  }

  state.ancestors.delete(group);
}

/**
 * Validates a whole document against the 2025.10 format. The root must be an
 * object; it is then walked as a group and every typed token value is checked.
 */
export function validateDocument(root: unknown, ctx: ValidationContext): DocumentValidation {
  const state: WalkState = {
    issues: [],
    stats: { tokens: 0, groups: 0, aliases: 0 },
    ancestors: new WeakSet(),
  };

  if (!isPlainObject(root)) {
    state.issues.push(createIssue(ctx, 'document.not-object', { actualType: typeName(root) }));
    return { issues: state.issues, stats: state.stats };
  }

  state.stats.groups = 1;
  walkGroup(root, ctx, undefined, 0, state);
  return { issues: state.issues, stats: state.stats };
}
