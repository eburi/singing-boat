import type { AppConfig } from '../config/types';
import type { WorldState } from '../state/WorldStateStore';
import type { ArrangementState } from './types';

type Condition = { sensor: string; above?: number; below?: number; between?: [number, number]; absAbove?: number };

export class ArrangementEngine {
  private state: ArrangementState;

  constructor(private config: AppConfig) {
    this.state = {
      scene: 'calm',
      intensity: 0,
      tension: 0,
      density: 0,
      phrasePosition: 0,
      bar: 1,
      beat: 1,
      activeLayers: {},
      activeMotifs: [],
    };
  }

  applyConfig(next: AppConfig): void {
    this.config = next;
  }

  update(world: WorldState, bar: number, beat: number): ArrangementState {
    const scene = this.pickScene(world);
    const sceneDef = this.config.arrangement.scenes[scene] ?? {};
    const intensity = Math.max(world.sensors.windSpeed?.normalizedValue ?? 0, world.sensors.boatSpeed?.normalizedValue ?? 0);
    const tension = Math.max(world.sensors.heel?.normalizedValue ?? 0, world.sensors.windGust?.normalizedValue ?? 0, world.sensors.depth?.normalizedValue ?? 0);
    const density = this.extractDensity(sceneDef.layers ?? {});
    const phraseLength = Math.max(1, this.config.arrangement.phraseLengthBars);

    this.state = {
      scene,
      intensity,
      tension,
      density,
      phrasePosition: ((bar - 1) % phraseLength) / phraseLength,
      bar,
      beat,
      activeLayers: sceneDef.layers ?? {},
      activeMotifs: Object.keys(sceneDef.layers ?? {}).filter((layerName) => layerName.toLowerCase().includes('warning') || layerName.toLowerCase().includes('accent')),
      transition:
        this.state.scene !== scene
          ? {
              fromScene: this.state.scene,
              toScene: scene,
              progress: 1,
            }
          : undefined,
    };
    return this.state;
  }

  getState(): ArrangementState {
    return this.state;
  }

  private extractDensity(layers: Record<string, any>): number {
    const values = Object.values(layers)
      .map((layer: any) => layer?.density)
      .filter((value: unknown): value is number => typeof value === 'number');
    if (values.length === 0) {
      return 0.25;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private pickScene(world: WorldState): string {
    const sorted = Object.entries(this.config.arrangement.scenes).sort((a, b) => (b[1].priority ?? 0) - (a[1].priority ?? 0));
    for (const [sceneName, sceneDef] of sorted) {
      if (this.sceneMatches(sceneDef.when ?? {}, world)) {
        return sceneName;
      }
    }
    return 'steady_sailing';
  }

  private sceneMatches(rule: any, world: WorldState): boolean {
    if (Array.isArray(rule.all)) {
      return rule.all.every((condition: Condition) => this.matchCondition(condition, world));
    }
    if (Array.isArray(rule.any)) {
      return rule.any.some((condition: Condition) => this.matchCondition(condition, world));
    }
    return false;
  }

  private matchCondition(condition: Condition, world: WorldState): boolean {
    const value = world.sensors[condition.sensor]?.normalizedValue;
    if (typeof value !== 'number') {
      return false;
    }
    if (typeof condition.above === 'number' && value <= condition.above) {
      return false;
    }
    if (typeof condition.below === 'number' && value >= condition.below) {
      return false;
    }
    if (condition.between && (value < condition.between[0] || value > condition.between[1])) {
      return false;
    }
    if (typeof condition.absAbove === 'number' && Math.abs(value * 2 - 1) <= condition.absAbove) {
      return false;
    }
    return true;
  }
}
