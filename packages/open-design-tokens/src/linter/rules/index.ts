import type { LintRule } from '../types.js';
import { extensionsAllowedVendors, extensionsSchema } from './extensions.js';
import { descriptionLength, groupNameLength, tokenNameLength } from './length.js';
import { namingConvention } from './naming-convention.js';
import { aliasMaxDepth, noDeprecatedAlias, noUnusedTokens } from './references.js';
import { noEmptyGroups, requireDescription, requireExplicitType } from './require.js';

export const BUILTIN_RULES: readonly LintRule[] = [
  tokenNameLength,
  groupNameLength,
  descriptionLength,
  namingConvention,
  requireDescription,
  requireExplicitType,
  aliasMaxDepth,
  noUnusedTokens,
  noDeprecatedAlias,
  noEmptyGroups,
  extensionsAllowedVendors,
  extensionsSchema,
] as LintRule[];

export const rules = {
  tokenNameLength,
  groupNameLength,
  descriptionLength,
  namingConvention,
  requireDescription,
  requireExplicitType,
  aliasMaxDepth,
  noUnusedTokens,
  noDeprecatedAlias,
  noEmptyGroups,
  extensionsAllowedVendors,
  extensionsSchema,
};

export type {
  AllowedVendorsOptions,
  ExtensionsSchemaOptions,
  FieldSchema,
  FieldSpec,
  VendorCheck,
} from './extensions.js';
export type { LengthOptions } from './length.js';
export type { NamingOptions, NamingStyle } from './naming-convention.js';
export type { AliasDepthOptions, UnusedTokensOptions } from './references.js';
