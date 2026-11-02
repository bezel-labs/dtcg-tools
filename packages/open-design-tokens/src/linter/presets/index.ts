import type { LintConfig, PresetName } from '../types.js';
import { recommended } from './recommended.js';

export const PRESETS: Record<PresetName, LintConfig> = { recommended };
export { recommended };
