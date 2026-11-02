import type { LintIssue, LintResult } from '../types.js';

export type FormatName = 'pretty' | 'json' | 'github';

export interface FormatOptions {
  /** File name shown next to each issue (and in GitHub annotations). */
  file?: string;
  /** Emit ANSI colors in the pretty format. */
  color?: boolean;
}

/** Every issue the result carries: validation issues first, then lint issues. */
export function allIssues(
  result: LintResult,
): (LintIssue | (LintIssue & { ruleId?: undefined }))[] {
  return [...(result.validation.issues as LintIssue[]), ...result.issues];
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control characters is the purpose
const CONTROL = /[\u0000-\u001f\u007f\u0080-\u009f]/g;

/** Removes ANSI escape sequences and control characters from user-controlled text. */
export function stripControl(text: string): string {
  return text.replace(CONTROL, '');
}

const paint = (on: boolean, code: string, text: string): string =>
  on ? `\u001b[${code}m${text}\u001b[0m` : text;

/** Human-readable output. User-controlled strings are stripped of control characters. */
export function formatPretty(result: LintResult, options: FormatOptions = {}): string {
  const color = options.color ?? false;
  const file = options.file ? stripControl(options.file) : 'tokens';
  const lines: string[] = [];
  const issues = allIssues(result);
  if (issues.length === 0) {
    lines.push(`${paint(color, '32', '✔')} ${file}: no issues`);
  } else {
    lines.push(paint(color, '4', file));
    for (const i of issues) {
      const sev =
        i.severity === 'error' ? paint(color, '31', 'error') : paint(color, '33', 'warning');
      const where = stripControl(i.path.dot || '(root)');
      const id = stripControl(i.ruleId ?? i.code);
      lines.push(
        `  ${where.padEnd(32)} ${sev.padEnd(color ? 16 : 7)} ${stripControl(i.message)}  ${paint(color, '2', id)}`,
      );
    }
  }
  const e = result.validation.errors.length + result.errors.length;
  const w = result.validation.warnings.length + result.warnings.length;
  lines.push('');
  lines.push(
    `${e} error${e === 1 ? '' : 's'}, ${w} warning${w === 1 ? '' : 's'}${result.skipped.length ? `, ${result.skipped.length} rule check${result.skipped.length === 1 ? '' : 's'} skipped on invalid nodes` : ''}`,
  );
  return `${lines.join('\n')}\n`;
}

/** Machine-readable output: the full result as JSON. */
export function formatJson(result: LintResult, options: FormatOptions = {}): string {
  return `${JSON.stringify({ file: options.file, ...result }, null, 2)}\n`;
}

/**
 * Encodes a value for a GitHub Actions workflow command. Percent, newline,
 * carriage return, and (for properties) colon and comma are escaped so a
 * token name cannot forge or break an annotation.
 */
export function encodeCommandValue(text: string, property = false): string {
  // Newlines are encoded (not stripped) so the message keeps its shape; all
  // other control characters are removed.
  // biome-ignore lint/suspicious/noControlCharactersInRegex: control characters other than CR/LF are removed
  const cleaned = text.replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f\u0080-\u009f]/g, '');
  let out = cleaned.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  if (property) out = out.replace(/:/g, '%3A').replace(/,/g, '%2C');
  return out;
}

/** GitHub Actions annotations: one `::error`/`::warning` command per issue. */
export function formatGithub(result: LintResult, options: FormatOptions = {}): string {
  const lines: string[] = [];
  for (const i of allIssues(result)) {
    const props = [
      options.file ? `file=${encodeCommandValue(options.file, true)}` : undefined,
      `title=${encodeCommandValue(i.ruleId ?? i.code, true)}`,
    ]
      .filter(Boolean)
      .join(',');
    lines.push(
      `::${i.severity} ${props}::${encodeCommandValue(`${i.path.dot || '(root)'}: ${i.message}`)}`,
    );
  }
  return lines.length ? `${lines.join('\n')}\n` : '';
}

export const FORMATTERS: Record<FormatName, (r: LintResult, o?: FormatOptions) => string> = {
  pretty: formatPretty,
  json: formatJson,
  github: formatGithub,
};
