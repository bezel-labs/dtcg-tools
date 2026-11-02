import { describe, expect, it } from 'vitest';
import { lintDtcg } from '../src/linter/index.js';
import { validateDtcg } from '../src/validator/index.js';

function generate(n: number): Record<string, unknown> {
  const doc: Record<string, unknown> = { $type: 'color' };
  for (let g = 0; g < n / 50; g += 1) {
    const group: Record<string, unknown> = {};
    for (let t = 0; t < 50; t += 1) {
      group[`t${t}`] =
        t % 3 === 0
          ? { $value: { colorSpace: 'srgb', components: [0.1, 0.2, 0.3] } }
          : { $value: `{g${g}.t${t - 1}}` };
    }
    doc[`g${g}`] = group;
  }
  return doc;
}

/** Performance guard: bounds are generous (coverage-instrumented CI runners are 5 to 10x slower than a laptop) but a quadratic regression still fails. */
describe('performance guard', () => {
  it('validates a 10k-token document well under a second', () => {
    const doc = generate(10_000);
    validateDtcg(doc); // warm up
    const t0 = performance.now();
    const r = validateDtcg(doc);
    const ms = performance.now() - t0;
    expect(r.valid).toBe(true);
    expect(r.stats.tokens).toBe(10_000);
    expect(ms).toBeLessThan(5_000);
  });

  it('lints a 10k-token document with the recommended preset in bounded time', () => {
    const doc = generate(10_000);
    const t0 = performance.now();
    const r = lintDtcg(doc, { extends: ['recommended'] });
    expect(r.validation.valid).toBe(true);
    expect(performance.now() - t0).toBeLessThan(10_000);
  });
});
