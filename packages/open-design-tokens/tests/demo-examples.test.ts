import { describe, expect, it } from 'vitest';
import { EXAMPLE_GROUPS } from '../../../apps/demo/src/examples.js';
import { validateDtcg } from '../src/validator/index.js';

/** The playground's examples must report exactly the codes they advertise. */
describe('demo examples', () => {
  for (const group of EXAMPLE_GROUPS) {
    for (const example of group.examples) {
      it(`${group.area} · ${example.title}`, () => {
        const got = validateDtcg(example.json).issues.map((i) => i.code);
        expect([...got].sort()).toEqual([...example.expect].sort());
      });
    }
  }
});
