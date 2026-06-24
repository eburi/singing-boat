import type { AppConfig } from '../config/types';
import type { WorldState } from '../state/WorldStateStore';
import type { ArrangementState } from './types';

type Condition = { sensor: string; above?: number; below?: number; between?: [number, number]; absAbove?: number };

export class ArrangementEngine {
  private state: ArrangementState;

  private pendingScene: string | null = null;

  private transitionStartMs: number | null = null;

  private previousBar = 1;

  private previousBeat = 1;

  private hasReceivedFirstUpdate = false;

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

  update(world: WorldState, bar: number, beat: number, now = performance.now()): ArrangementState {
    const desiredScene = this.pickScene(world);
    const currentSceneDef = this.config.arrangement.scenes[this.state.scene] ?? {};

    if (!this.hasReceivedFirstUpdate) {
      this.hasReceivedFirstUpdate = true;
      this.state.scene = desiredScene;
    }

    if (desiredScene !== this.state.scene && desiredScene !== this.pendingScene) {
      const targetDef = this.config.arrangement.scenes[desiredScene] ?? {};
      if (targetDef.interrupt) {
        this.startTransition(desiredScene, now);
      } else {
        this.pendingScene = desiredScene;
      }
    }

    if (this.pendingScene && this.shouldApplyAtBoundary(bar, beat)) {
      this.startTransition(this.pendingScene, now);
      this.pendingScene = null;
    }

    const transitionDuration = Math.max(0, this.config.arrangement.transition.defaultDurationMs);
    const hasTransition = this.state.transition && this.transitionStartMs !== null;
    const transitionStartMs = this.transitionStartMs ?? now;
    const transitionProgress = hasTransition && transitionDuration > 0 ? Math.min(1, (now - transitionStartMs) / transitionDuration) : hasTransition ? 1 : 0;

    if (hasTransition && transitionProgress >= 1) {
      this.state.scene = this.state.transition!.toScene;
      this.state.transition = undefined;
      this.transitionStartMs = null;
    }

    const scene = this.state.scene;
    const sceneDef = this.config.arrangement.scenes[scene] ?? currentSceneDef;
    const intensity = Math.max(world.sensors.windSpeed?.normalizedValue ?? 0, world.sensors.boatSpeed?.normalizedValue ?? 0);
    const tension = Math.max(world.sensors.heel?.normalizedValue ?? 0, world.sensors.windGust?.normalizedValue ?? 0, world.sensors.depth?.normalizedValue ?? 0);
    const blendedLayers = this.state.transition
      ? this.blendLayers(
          this.config.arrangement.scenes[this.state.transition.fromScene]?.layers ?? {},
          this.config.arrangement.scenes[this.state.transition.toScene]?.layers ?? {},
          transitionProgress,
        )
      : sceneDef.layers ?? {};
    const density = this.extractDensity(blendedLayers);
    const phraseLength = Math.max(1, this.config.arrangement.phraseLengthBars);

    this.state = {
      scene,
      intensity,
      tension,
      density,
      phrasePosition: ((bar - 1) % phraseLength) / phraseLength,
      bar,
      beat,
      activeLayers: blendedLayers,
      activeMotifs: this.extractMotifs(blendedLayers),
      transition: this.state.transition
        ? {
            ...this.state.transition,
            progress: transitionProgress,
          }
        : undefined,
    };

    this.previousBar = bar;
    this.previousBeat = beat;

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

  private extractMotifs(layers: Record<string, any>): string[] {
    const motifs: string[] = [];
    for (const [layerName, layer] of Object.entries(layers)) {
      if (typeof layer?.motif === 'string') {
        motifs.push(layer.motif);
      }
      const lower = layerName.toLowerCase();
      if (lower.includes('warning') || lower.includes('accent') || lower.includes('motif')) {
        motifs.push(layerName);
      }
    }
    return [...new Set(motifs)];
  }

  private blendLayers(fromLayers: Record<string, any>, toLayers: Record<string, any>, progress: number): Record<string, any> {
    const blended: Record<string, any> = {};
    const names = new Set([...Object.keys(fromLayers), ...Object.keys(toLayers)]);
    for (const name of names) {
      const from = fromLayers[name] ?? {};
      const to = toLayers[name] ?? {};
      const fromGain = typeof from.gain === 'number' ? from.gain : from.enabled ? 1 : 0;
      const toGain = typeof to.gain === 'number' ? to.gain : to.enabled ? 1 : 0;
      const fromDensity = typeof from.density === 'number' ? from.density : from.enabled ? 1 : 0;
      const toDensity = typeof to.density === 'number' ? to.density : to.enabled ? 1 : 0;
      blended[name] = {
        ...to,
        enabled: progress < 1 ? Boolean(from.enabled || to.enabled) : Boolean(to.enabled),
        gain: fromGain + (toGain - fromGain) * progress,
        density: fromDensity + (toDensity - fromDensity) * progress,
      };
    }
    return blended;
  }

  private startTransition(toScene: string, now: number): void {
    if (toScene === this.state.scene) {
      return;
    }
    this.state.transition = {
      fromScene: this.state.scene,
      toScene,
      progress: 0,
    };
    this.transitionStartMs = now;
  }

  private shouldApplyAtBoundary(bar: number, beat: number): boolean {
    const quantizeTo = this.config.arrangement.transition.quantizeTo;
    if (quantizeTo === 'beat') {
      return beat !== this.previousBeat;
    }
    if (quantizeTo === 'bar') {
      return beat === 1 && bar !== this.previousBar;
    }
    const phraseLength = Math.max(1, this.config.arrangement.phraseLengthBars);
    return beat === 1 && bar !== this.previousBar && (bar - 1) % phraseLength === 0;
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
