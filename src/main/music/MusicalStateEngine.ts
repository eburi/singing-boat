import type { AppConfig } from '../config/types';
import type { WorldState } from '../state/WorldStateStore';
import { SchedulerClock } from './SchedulerClock';
import { ArrangementEngine } from './ArrangementEngine';
import { HarmonyEngine } from './HarmonyEngine';
import { MappingEngine } from './MappingEngine';
import { MotifEngine } from './MotifEngine';
import type { MusicalState } from './types';

export class MusicalStateEngine {
  private clock = new SchedulerClock();

  public arrangement: ArrangementEngine;

  public harmony: HarmonyEngine;

  public mapping: MappingEngine;

  public motif: MotifEngine;

  constructor(private config: AppConfig) {
    this.arrangement = new ArrangementEngine(config);
    this.harmony = new HarmonyEngine(config);
    this.mapping = new MappingEngine(config);
    this.motif = new MotifEngine(config);
  }

  applyConfig(next: AppConfig): void {
    this.config = next;
    this.arrangement.applyConfig(next);
    this.harmony.applyConfig(next);
    this.mapping.applyConfig(next);
    this.motif.applyConfig(next);
  }

  update(world: WorldState, now = performance.now()): MusicalState {
    const bpmSensor = world.sensors[this.config.clock.bpm.source]?.normalizedValue ?? 0;
    const bpm = this.config.clock.bpm.base + (this.config.clock.bpm.max - this.config.clock.bpm.base) * bpmSensor * this.config.clock.bpm.amount;
    this.clock.setBpm(Math.max(this.config.clock.bpm.min, Math.min(this.config.clock.bpm.max, bpm)));
    const beatPosition = this.clock.nowBeat(now);
    const beat = (Math.floor(beatPosition) % this.config.clock.beatsPerBar) + 1;
    const bar = Math.floor(beatPosition / this.config.clock.beatsPerBar) + 1;

    const arrangement = this.arrangement.update(world, bar, beat);
    const harmony = this.harmony.update(world, arrangement, now);

    return {
      world,
      arrangement,
      harmony,
    };
  }
}
