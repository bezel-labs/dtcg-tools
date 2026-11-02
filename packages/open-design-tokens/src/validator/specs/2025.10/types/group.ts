import type { DesignToken, Extensions, TokenType } from './token.js';

export interface GroupCommon {
  $description?: string;
  /** Default `$type` for descendant tokens that do not set their own. */
  $type?: TokenType;
  /** Alias to another group whose members this group inherits. */
  $extends?: `{${string}}`;
  $deprecated?: boolean | string;
  $extensions?: Extensions;
}

/**
 * A group: reserved `$` properties plus any number of named tokens or
 * sub-groups. Names must not start with `$` or contain `{`, `}` or `.`.
 */
export type Group = GroupCommon & {
  [name: string]: DesignToken | Group | GroupCommon[keyof GroupCommon];
};

/** The root of a design tokens document is a group. */
export type DesignTokens = Group;
