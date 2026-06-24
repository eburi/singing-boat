import { midi as noteMidi } from '@tonaljs/note';
import type { AppConfig } from '../config/types';
import type { HarmonyState, ArrangementState } from './types';
import { SeededRandom } from '../utils/seededRandom';

export interface MotifNoteEvent {
  channel: number;
  note: number;
  velocity: number;
  durationBeats: number;
  source: string;
}

export class MotifEngine {
  private random: SeededRandom;

  constructor(private config: AppConfig) {
    this.random = new SeededRandom(config.app.randomSeed);
  }

  applyConfig(next: AppConfig): void {
    this.config = next;
    this.random = new SeededRandom(next.app.randomSeed);
  }

  generate(activeMotifs: string[], arrangement: ArrangementState, harmony: HarmonyState): MotifNoteEvent[] {
    const events: MotifNoteEvent[] = [];
    for (const motifName of activeMotifs) {
      const motif = this.config.motifs[motifName];
      if (!motif) {
        continue;
      }
      const channel = this.resolveChannel(motif.channel ?? 'melody');
      if (!channel) {
        continue;
      }
      const base = this.baseNoteFromHarmony(harmony);
      const velocity = motif.velocity?.fixed ?? this.interpolate(motif.velocity?.min ?? 40, motif.velocity?.max ?? 110, arrangement.intensity);

      switch (motif.type) {
        case 'drone':
          events.push({ channel, note: base - 24, velocity, durationBeats: 4, source: motifName });
          events.push({ channel, note: base - 17, velocity: Math.max(20, velocity - 20), durationBeats: 4, source: motifName });
          break;
        case 'pulse':
          events.push({ channel, note: base - 24, velocity, durationBeats: 0.5, source: motifName });
          break;
        case 'warning':
          for (const degree of motif.pitch?.degrees ?? [1, 5, 1]) {
            events.push({ channel, note: base + (degree - 1) * 2 + 12, velocity, durationBeats: 0.5, source: motifName });
          }
          break;
        case 'arpeggio': {
          const steps = motif.rhythm?.steps ?? 4;
          for (let i = 0; i < steps; i += 1) {
            const up = i < Math.ceil(steps / 2);
            const offset = up ? i : steps - i;
            events.push({ channel, note: base + offset * 2, velocity, durationBeats: 0.25, source: motifName });
          }
          break;
        }
        case 'rising':
        default: {
          const count = Math.max(1, Math.floor(this.interpolate(1, 6, arrangement.density)));
          for (let i = 0; i < count; i += 1) {
            const jitter = this.random.next() < 0.2 ? 1 : 0;
            events.push({ channel, note: base + i * 2 + jitter, velocity, durationBeats: 0.5, source: motifName });
          }
          break;
        }
      }
    }
    return events;
  }

  private baseNoteFromHarmony(harmony: HarmonyState): number {
    const midi = noteMidi(`${harmony.key}4`);
    return typeof midi === 'number' ? midi : 62;
  }

  private resolveChannel(channelOrAlias: string | number): number | null {
    if (typeof channelOrAlias === 'number') {
      return channelOrAlias;
    }
    return this.config.midi.channels[channelOrAlias] ?? null;
  }

  private interpolate(min: number, max: number, amount: number): number {
    return Math.round(min + (max - min) * Math.max(0, Math.min(1, amount)));
  }
}
