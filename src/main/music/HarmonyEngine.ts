import { get as getChord } from '@tonaljs/chord';
import { chroma as noteChroma, midi as noteMidi } from '@tonaljs/note';
import { get as getScale } from '@tonaljs/scale';
import type { AppConfig } from '../config/types';
import type { WorldState } from '../state/WorldStateStore';
import type { ArrangementState, HarmonyState, MidiNoteCandidate, NoteRange, QuantizeOptions } from './types';

const romanToDegree: Record<string, number> = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
};

export class HarmonyEngine {
  private progressionIndex = 0;

  private lastBar = 0;

  private state: HarmonyState;

  constructor(private config: AppConfig) {
    this.state = {
      key: config.harmony.key,
      mode: config.harmony.mode,
      chord: config.harmony.progression.chords[0] ?? 'i7',
      progressionIndex: 0,
      tension: 0,
      quantizeEnabled: config.harmony.quantize.enabled,
    };
  }

  applyConfig(next: AppConfig): void {
    this.config = next;
    this.state = {
      ...this.state,
      key: next.harmony.key,
      mode: next.harmony.mode,
      quantizeEnabled: next.harmony.quantize.enabled,
    };
  }

  getState(): HarmonyState {
    return this.state;
  }

  update(world: WorldState, arrangement: ArrangementState, _now: number): HarmonyState {
    const barsPerChord = Math.max(1, this.config.harmony.progression.advance.barsPerChord);
    if (arrangement.bar !== this.lastBar && arrangement.bar % barsPerChord === 0) {
      this.progressionIndex = (this.progressionIndex + 1) % this.config.harmony.progression.chords.length;
      this.lastBar = arrangement.bar;
    }

    const sensorPush = world.sensors[this.config.harmony.progression.advance.sensor]?.normalizedValue ?? 0;
    const thresholdHit = this.config.harmony.progression.advance.thresholds.some((t) => sensorPush >= t);
    if (thresholdHit && arrangement.beat === 1) {
      this.progressionIndex = (this.progressionIndex + 1) % this.config.harmony.progression.chords.length;
    }

    const tension = this.config.harmony.tension.sources.reduce((sum, entry) => {
      const value = world.sensors[entry.sensor]?.normalizedValue ?? 0;
      return sum + value * entry.weight;
    }, 0);

    this.state = {
      key: this.config.harmony.key,
      mode: this.config.harmony.mode,
      chord: this.config.harmony.progression.chords[this.progressionIndex] ?? this.config.harmony.progression.chords[0],
      progressionIndex: this.progressionIndex,
      tension: Math.max(0, Math.min(1, tension)),
      quantizeEnabled: this.config.harmony.quantize.enabled,
    };
    return this.state;
  }

  quantizeNote(candidate: MidiNoteCandidate, options?: QuantizeOptions): MidiNoteCandidate {
    if (!this.config.harmony.quantize.enabled) {
      return candidate;
    }
    const allowPassing = options?.allowPassingTones ?? this.config.harmony.quantize.allowPassingTones;
    const scaleNotes = this.getScaleMidiClasses();
    const noteClass = candidate.note % 12;
    if (scaleNotes.includes(noteClass)) {
      return candidate;
    }
    const deterministicChance = ((candidate.note * 31 + Math.floor(candidate.beatPosition * 100)) % 100) / 100;
    if (allowPassing && candidate.beatPosition % 1 > 0 && deterministicChance < this.config.harmony.quantize.passingToneProbability) {
      return candidate;
    }
    const nearest = this.findNearestInScale(candidate.note, scaleNotes);
    return { ...candidate, note: nearest };
  }

  getChordTones(octave = 4): number[] {
    const symbol = this.resolveChordSymbol(this.state.chord);
    const chord = getChord(symbol);
    return chord.notes
      .map((name: string) => noteMidi(`${name}${octave}`))
      .filter((midi): midi is number => typeof midi === 'number');
  }

  getScaleNotes(range: NoteRange): number[] {
    const classes = this.getScaleMidiClasses();
    const notes: number[] = [];
    for (let n = range.low; n <= range.high; n += 1) {
      if (classes.includes(n % 12)) {
        notes.push(n);
      }
    }
    return notes;
  }

  private resolveChordSymbol(romanChord: string): string {
    const bare = romanChord.replace(/(maj7|7|m7|sus2|sus4|dim|aug)/gi, '');
    const quality = romanChord.replace(bare, '');
    const degreeKey = bare.toLowerCase();
    const degree = romanToDegree[degreeKey] ?? 1;
    const scale = getScale(`${this.config.harmony.key} ${this.config.harmony.mode}`);
    const root = scale.notes[(degree - 1) % scale.notes.length] ?? this.config.harmony.key;
    const suffix = quality || (bare === bare.toUpperCase() ? '' : 'm');
    return `${root}${suffix}`;
  }

  private getScaleMidiClasses(): number[] {
    const scale = getScale(`${this.config.harmony.key} ${this.config.harmony.mode}`);
    return scale.notes
      .map((noteName: string) => noteChroma(noteName))
      .filter((chroma): chroma is number => typeof chroma === 'number');
  }

  private findNearestInScale(note: number, scaleClasses: number[]): number {
    let best = note;
    let dist = Number.POSITIVE_INFINITY;
    for (let n = note - 12; n <= note + 12; n += 1) {
      if (!scaleClasses.includes(((n % 12) + 12) % 12)) {
        continue;
      }
      const d = Math.abs(n - note);
      if (d < dist) {
        dist = d;
        best = n;
      }
    }
    return best;
  }
}
