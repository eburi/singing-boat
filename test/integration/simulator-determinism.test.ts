import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../src/main/config/defaults';
import { WorldStateStore } from '../../src/main/state/WorldStateStore';
import { MusicalStateEngine } from '../../src/main/music/MusicalStateEngine';

function runFixture(): Array<{ scene: string; chord: string; tension: number }> {
  const world = new WorldStateStore(defaultConfig);
  const music = new MusicalStateEngine(defaultConfig);
  const snapshots: Array<{ scene: string; chord: string; tension: number }> = [];

  const fixture = [
    [
      { path: 'environment.wind.speedApparent', value: 4.5 },
      { path: 'navigation.speedThroughWater', value: 1.2 },
      { path: 'navigation.depth.belowTransducer', value: 20 },
      { path: 'navigation.attitude.roll', value: 0.08 },
      { path: 'environment.wind.angleApparent', value: 0.3 },
    ],
    [
      { path: 'environment.wind.speedApparent', value: 8.2 },
      { path: 'navigation.speedThroughWater', value: 3.1 },
      { path: 'navigation.depth.belowTransducer', value: 7 },
      { path: 'navigation.attitude.roll', value: 0.45 },
      { path: 'environment.wind.angleApparent', value: 1.2 },
    ],
  ];

  for (let i = 0; i < fixture.length; i += 1) {
    world.ingest(
      fixture[i].map((entry) => ({
        ...entry,
        timestamp: 1_700_000_000_000 + i * 1000,
        source: 'fixture',
      })),
    );
    const result = music.update(world.getState(), i * 100);
    snapshots.push({
      scene: result.arrangement.scene,
      chord: result.harmony.chord,
      tension: Number(result.harmony.tension.toFixed(3)),
    });
  }

  return snapshots;
}

describe('deterministic fixture', () => {
  it('produces stable arrangement and harmony snapshots', () => {
    const a = runFixture();
    const b = runFixture();
    expect(a).toEqual(b);
  });
});
