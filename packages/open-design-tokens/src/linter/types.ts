import type { IssuePath, Severity, ValidationIssue } from '../core/issue.js';
import type { NodeInfo, PreparedDocument } from '../core/prepare.js';
import type { ValidationResult } from '../validator/result.js';
import type { Resolver } from '../validator/specs/2025.10/aliases/resolver.js';
import type { MessageCatalog } from '../validator/specs/2025.10/messages.js';

/** A lint diagnostic: a validation issue plus the rule that produced it. */
export interface LintIssue extends ValidationIssue {
  ruleId: string;
}

/** What a rule passes to `report`; the engine fills in code prefix, severity, and message escaping. */
export interface RuleReport {
  /** Optional suffix appended to the rule id: `token-name-length.too-short`. */
  code?: string;
  message: string;
  path: IssuePath | readonly string[];
  meta?: Record<string, unknown>;
}

/** Severity as written in a config; `off` disables the rule. */
export type RuleSeverity = Severity | 'off';

/** `'error'`, `['warning', { ...options }]`, or `'off'`. */
export type RuleSetting<Options = unknown> = RuleSeverity | readonly [RuleSeverity, Options];

export interface LintConfig {
  /** Presets to start from; later entries win, then `rules` overrides. */
  extends?: readonly PresetName[];
  rules?: Record<string, RuleSetting>;
}

export type PresetName = 'recommended';

/** Edges of the reference graph: alias/`$ref` source token → resolved target tokens. */
export interface ReferenceGraph {
  /** Every token pointer that is referenced by at least one alias or `$ref`. */
  referenced: ReadonlySet<string>;
  /** For each token pointer, the pointers it references directly. */
  outgoing: ReadonlyMap<string, readonly string[]>;
}

export interface LintContext<Options = unknown> {
  doc: PreparedDocument;
  resolver: Resolver;
  validation: ValidationResult;
  references: ReferenceGraph;
  options: Options;
  /** True when the validator reported an error at or below this pointer. */
  isInvalid(pointer: string): boolean;
  report(issue: RuleReport): void;
}

export interface RuleVisitor {
  token?(node: NodeInfo): void;
  group?(node: NodeInfo): void;
  /** Called once after every node; use for document-wide checks. */
  document?(): void;
}

export interface RuleMeta<Options> {
  description: string;
  /** Included in the `recommended` preset. */
  recommended?: boolean;
  defaultSeverity: RuleSeverity;
  /** Default options, merged under user options. */
  defaultOptions?: Options;
  /** Returns a message when `options` are malformed; the engine then throws (programmer error). */
  validateOptions?(options: unknown): string | undefined;
}

export interface LintRule<Options = unknown> {
  /** Flat kebab-case id, e.g. `token-name-length`. */
  id: string;
  meta: RuleMeta<Options>;
  create(ctx: LintContext<Options>): RuleVisitor;
}

export interface SkippedCheck {
  ruleId: string;
  pointer: string;
  reason: string;
}

export interface LintResult {
  /** `validation.valid` and no lint errors. */
  valid: boolean;
  issues: LintIssue[];
  errors: LintIssue[];
  warnings: LintIssue[];
  /** Rule/node pairs skipped because the validator flagged the node. */
  skipped: SkippedCheck[];
  validation: ValidationResult;
}

export interface ResolvedRule {
  rule: LintRule;
  severity: Severity;
  options: unknown;
}

export interface ResolvedConfig {
  rules: readonly ResolvedRule[];
}

/** Presentation options for a linter; none of them change what is reported. */
export interface LinterOptions {
  /** Validator message wording by issue code; see `ValidateOptions.messages`. */
  messages?: Partial<MessageCatalog>;
}

/**
 * A configured linter. Create one with `createLinter` and reuse it for every
 * document: the config is resolved once, when the linter is created.
 */
export interface Linter {
  /** Validates against the spec, then runs the configured rules. Never throws on document input. */
  lint(input: unknown): LintResult;
  /** The resolved configuration: the rules that run, each with its severity and merged options. */
  config: ResolvedConfig;
}
