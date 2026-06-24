import { describe, expect, it } from 'vitest';
import { ArrangementEngine } from '../../src/main/music/ArrangementEngine';
import { defaultConfig } from '../../src/main/config/defaults';

function worldWithValues(values: Record<string, number>) {
  return {
    sensors: Object.fromEntries(
      Object.entries(values).map(([name, normalizedValue]) => [name, { name, normalizedValue, status: 'valid' as const }]),
    ),
    updatedAt: Date.now(),
  };
}

describe('ArrangementEngine transitions', () => {
  it('holds pending scene until configured boundary', () => {
    const engine = new ArrangementEngine(defaultConfig);
    engine.update(
      worldWithValues({ windSpeed: 0.35, boatSpeed: 0.4, depth: 0.1, heel: 0.5, windGust: 0.1 }) as any,
      1,
      2,
      100,
    );

    const duringBar = engine.update(
      worldWithValues({ windSpeed: 0.8, boatSpeed: 0.8, depth: 0.1, heel: 0.5, windGust: 0.1 }) as any,
      1,
      3,
      150,
    );
    expect(duringBar.scene).toBe('steady_sailing');

    const onBoundary = engine.update(
      worldWithValues({ windSpeed: 0.8, boatSpeed: 0.8, depth: 0.1, heel: 0.5, windGust: 0.1 }) as any,
      2,
      1,
      5000,
    );
    expect(onBoundary.transition).toBeDefined();
  });
});
