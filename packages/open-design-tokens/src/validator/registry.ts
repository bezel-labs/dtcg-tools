import * as spec202510 from './specs/2025.10/index.js';

export const SPEC_IDS = ['2025.10'] as const;
export type SpecId = (typeof SPEC_IDS)[number];
export const LATEST_SPEC: SpecId = '2025.10';

export interface SpecModule {
  id: SpecId;
  validateDocument: typeof spec202510.validateDocument;
}

const REGISTRY: Record<SpecId, SpecModule> = {
  '2025.10': { id: '2025.10', validateDocument: spec202510.validateDocument },
};

/** Looks up a spec module. Throws on an unknown id: that is a programmer error, not a document error. */
export function getSpec(id: SpecId | undefined): SpecModule {
  const spec = REGISTRY[id ?? LATEST_SPEC];
  if (!spec) {
    throw new RangeError(
      `Unknown DTCG spec version: ${String(id)}. Supported: ${SPEC_IDS.join(', ')}`,
    );
  }
  return spec;
}
