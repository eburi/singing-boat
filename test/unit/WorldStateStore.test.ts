import { describe, expect, it } from 'vitest';
import { WorldStateStore } from '../../src/main/state/WorldStateStore';
import { defaultConfig } from '../../src/main/config/defaults';

describe('WorldStateStore', () => {
  it('updates mapped sensor and normalizes values', () => {
    const store = new WorldStateStore(defaultConfig);

    store.ingest([
      {
        path: 'environment.wind.speedApparent',
        value: 10,
        timestamp: Date.now(),
        source: 'test',
      },
    ]);

    const state = store.getState();
    expect(state.sensors.windSpeed.status).toBe('valid');
    expect(state.sensors.windSpeed.normalizedValue).toBeGreaterThan(0.1);
  });

  it('marks stale values', () => {
    const store = new WorldStateStore(defaultConfig);
    const old = Date.now() - 6000;

    store.ingest([
      {
        path: 'environment.wind.speedApparent',
        value: 3,
        timestamp: old,
        source: 'test',
      },
    ]);
    store.tick(Date.now());

    const state = store.getState();
    expect(state.sensors.windSpeed.status).toBe('stale');
  });
});
