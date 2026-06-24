import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../src/main/config/defaults';
import { semanticValidateConfig } from '../../src/main/config/ConfigService';

describe('semanticValidateConfig', () => {
  it('returns no errors for default config', () => {
    expect(semanticValidateConfig(defaultConfig)).toEqual([]);
  });

  it('detects unknown sensor references', () => {
    const cfg = {
      ...defaultConfig,
      clock: {
        ...defaultConfig.clock,
        bpm: {
          ...defaultConfig.clock.bpm,
          source: 'missingSensor',
        },
      },
    };
    const errors = semanticValidateConfig(cfg as any);
    expect(errors.some((e) => e.includes('clock.bpm.source'))).toBe(true);
  });

  it('detects unknown channel aliases and bad note names', () => {
    const cfg = {
      ...defaultConfig,
      motifs: {
        ...defaultConfig.motifs,
        windMelody: {
          ...defaultConfig.motifs.windMelody,
          channel: 'missingAlias',
          range: { low: 'H2', high: 'A5' },
        },
      },
    };
    const errors = semanticValidateConfig(cfg as any);
    expect(errors.some((e) => e.includes('unknown alias'))).toBe(true);
    expect(errors.some((e) => e.includes('invalid note'))).toBe(true);
  });
});
