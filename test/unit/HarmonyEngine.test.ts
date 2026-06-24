import { describe, expect, it } from 'vitest';
import { HarmonyEngine } from '../../src/main/music/HarmonyEngine';
import { defaultConfig } from '../../src/main/config/defaults';

describe('HarmonyEngine', () => {
  it('quantizes notes to active scale', () => {
    const engine = new HarmonyEngine(defaultConfig);
    const candidate = { note: 61, velocity: 90, channel: 1, beatPosition: 1 };
    const quantized = engine.quantizeNote(candidate, { allowPassingTones: false });
    expect([60, 62]).toContain(quantized.note);
  });

  it('returns chord tones for current chord', () => {
    const engine = new HarmonyEngine(defaultConfig);
    const tones = engine.getChordTones(4);
    expect(tones.length).toBeGreaterThan(1);
  });
});
