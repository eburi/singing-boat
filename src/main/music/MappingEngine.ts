import type { AppConfig } from '../config/types';
import type { WorldState } from '../state/WorldStateStore';
import type { ArrangementState, HarmonyState } from './types';
import { clamp } from '../utils/math';

export type MappingCommand =
  | { type: 'cc'; channel: number; controller: number; value: number; source: string }
  | { type: 'pitchBend'; channel: number; value: number; source: string }
  | { type: 'programChange'; channel: number; program: number; source: string }
  | { type: 'motifTrigger'; motif: string; source: string }
  | { type: 'motifParameter'; motif: string; parameter: string; value: number; source: string };

export class MappingEngine {
  constructor(private config: AppConfig) {}

  applyConfig(next: AppConfig): void {
    this.config = next;
  }

  update(world: WorldState, _arrangement: ArrangementState, _harmony: HarmonyState): MappingCommand[] {
    const commands: MappingCommand[] = [];
    for (const mapping of this.config.mappings) {
      if (mapping.enabled === false) {
        continue;
      }
      const sensor = world.sensors[mapping.source];
      if (!sensor) {
        continue;
      }
      const sourceValue = sensor.normalizedValue;
      const target = mapping.target ?? {};
      if (target.type === 'cc') {
        const min = mapping.transform?.min ?? 0;
        const max = mapping.transform?.max ?? 127;
        const ccValue = Math.round(clamp(min + (max - min) * sourceValue, 0, 127));
        const channel = this.resolveChannel(target.channel);
        if (channel) {
          commands.push({ type: 'cc', channel, controller: target.controller, value: ccValue, source: mapping.id });
        }
      } else if (target.type === 'pitchBend') {
        const min = mapping.transform?.min ?? -1;
        const max = mapping.transform?.max ?? 1;
        const scaled = min + (max - min) * sourceValue;
        const bend = Math.round(8192 + scaled * 8191);
        const channel = this.resolveChannel(target.channel);
        if (channel) {
          commands.push({ type: 'pitchBend', channel, value: clamp(bend, 0, 16383), source: mapping.id });
        }
      } else if (target.type === 'programChange') {
        const channel = this.resolveChannel(target.channel);
        if (channel) {
          commands.push({ type: 'programChange', channel, program: clamp(Math.round(sourceValue * 127), 0, 127), source: mapping.id });
        }
      } else if (target.type === 'motifTrigger') {
        const trigger = mapping.trigger ?? {};
        const hit = typeof trigger.below === 'number' ? sourceValue <= trigger.below : typeof trigger.above === 'number' ? sourceValue >= trigger.above : false;
        if (hit) {
          commands.push({ type: 'motifTrigger', motif: target.motif, source: mapping.id });
        }
      } else if (target.type === 'motifParameter') {
        const transformed = this.circularToDegree(sensor.convertedValue ?? 0);
        commands.push({ type: 'motifParameter', motif: target.motif, parameter: target.parameter, value: transformed, source: mapping.id });
      }
    }
    return commands;
  }

  private circularToDegree(rad: number): number {
    const wrapped = ((rad + Math.PI) / (2 * Math.PI)) % 1;
    return Math.max(1, Math.min(7, Math.round(1 + wrapped * 6)));
  }

  private resolveChannel(value: string | number): number | null {
    if (typeof value === 'number') {
      return value;
    }
    return this.config.midi.channels[value] ?? null;
  }
}
