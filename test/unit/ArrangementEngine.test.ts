import { describe, expect, it } from 'vitest';
import { ArrangementEngine } from '../../src/main/music/ArrangementEngine';
import { defaultConfig } from '../../src/main/config/defaults';

describe('ArrangementEngine', () => {
  it('selects shallow water scene with high priority', () => {
    const engine = new ArrangementEngine(defaultConfig);
    const world = {
      sensors: {
        windSpeed: { name: 'windSpeed', normalizedValue: 0.3, status: 'valid' as const },
        boatSpeed: { name: 'boatSpeed', normalizedValue: 0.4, status: 'valid' as const },
        depth: { name: 'depth', normalizedValue: 0.95, status: 'valid' as const },
        heel: { name: 'heel', normalizedValue: 0.2, status: 'valid' as const },
        windGust: { name: 'windGust', normalizedValue: 0.1, status: 'valid' as const },
      },
      updatedAt: Date.now(),
    };

    const arrangement = engine.update(world as any, 1, 1);
    expect(arrangement.scene).toBe('shallow_water');
    expect(arrangement.activeLayers.shallowWarning.enabled).toBe(true);
  });
});
