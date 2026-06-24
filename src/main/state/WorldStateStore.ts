import { EventEmitter } from 'node:events';
import type { AppConfig, SensorConfig } from '../config/types';
import { applyCurve, normalizeLinear } from '../utils/math';
import { convertUnits } from '../utils/units';
import type { ParsedSignalKValue } from '../signalk/types';
import type { SensorValue, SensorStatus } from './SensorValue';

export interface WorldState {
  sensors: Record<string, SensorValue>;
  updatedAt: number;
}

type PathIndexEntry = {
  sensorName: string;
  config: SensorConfig;
};

export class WorldStateStore extends EventEmitter {
  private sensors = new Map<string, SensorValue>();

  private pathIndex = new Map<string, PathIndexEntry[]>();

  private updatedAt = Date.now();

  private derivedHistory = new Map<string, Array<{ t: number; v: number }>>();

  constructor(private config: AppConfig) {
    super();
    this.rebuildIndex(config);
    this.initializeMissingSensors();
  }

  applyConfig(nextConfig: AppConfig): void {
    this.config = nextConfig;
    this.rebuildIndex(nextConfig);
    this.initializeMissingSensors();
    this.emitState();
  }

  ingest(values: ParsedSignalKValue[]): void {
    let changed = false;
    for (const value of values) {
      const targets = this.pathIndex.get(value.path) ?? [];
      for (const target of targets) {
        changed = this.updateMappedSensor(target.sensorName, target.config, value) || changed;
      }
    }
    changed = this.recomputeDerivedSensors() || changed;
    if (changed) {
      this.updatedAt = Date.now();
      this.emitState();
    }
  }

  tick(now = Date.now()): void {
    let changed = false;
    for (const [name, sensor] of this.sensors) {
      const sensorCfg = this.config.sensors[name];
      const staleAfterMs = sensorCfg?.staleAfterMs ?? this.config.signalk.stalePolicy.defaultStaleAfterMs;
      if (sensor.timestamp && sensor.status === 'valid' && now - sensor.timestamp > staleAfterMs) {
        this.sensors.set(name, { ...sensor, status: 'stale' });
        changed = true;
      }
    }
    if (changed) {
      this.emitState();
    }
  }

  getState(): WorldState {
    const sensors: Record<string, SensorValue> = {};
    for (const [name, value] of this.sensors) {
      sensors[name] = value;
    }
    return { sensors, updatedAt: this.updatedAt };
  }

  private rebuildIndex(config: AppConfig): void {
    this.pathIndex.clear();
    for (const [name, sensorConfig] of Object.entries(config.sensors)) {
      if (!sensorConfig.path) {
        continue;
      }
      const list = this.pathIndex.get(sensorConfig.path) ?? [];
      list.push({ sensorName: name, config: sensorConfig });
      this.pathIndex.set(sensorConfig.path, list);
    }
  }

  private initializeMissingSensors(): void {
    for (const name of Object.keys(this.config.sensors)) {
      if (!this.sensors.has(name)) {
        this.sensors.set(name, {
          name,
          normalizedValue: 0,
          status: 'missing',
        });
      }
    }
  }

  private updateMappedSensor(name: string, cfg: SensorConfig, value: ParsedSignalKValue): boolean {
    const prev = this.sensors.get(name);
    const converted = convertUnits(value.value, cfg.sourceUnits, cfg.displayUnits);
    const normalized = this.normalize(converted, cfg);

    const smoothed = this.applySmoothing(prev?.normalizedValue, normalized, cfg);
    const deadband = cfg.deadband ?? 0;
    const current = prev?.normalizedValue ?? 0;
    if (Math.abs(smoothed - current) < deadband && prev?.status === 'valid') {
      this.sensors.set(name, {
        ...prev,
        rawValue: value.value,
        convertedValue: converted,
        source: value.source,
        timestamp: value.timestamp,
        status: 'valid',
      } as SensorValue);
      return false;
    }

    const next: SensorValue = {
      name,
      path: cfg.path,
      rawValue: value.value,
      convertedValue: converted,
      normalizedValue: smoothed,
      source: value.source,
      timestamp: value.timestamp,
      status: this.sensorStatusFromNumber(value.value),
    };
    this.sensors.set(name, next);
    return true;
  }

  private recomputeDerivedSensors(): boolean {
    let changed = false;
    const now = Date.now();
    for (const [name, cfg] of Object.entries(this.config.sensors)) {
      if (!cfg.derivedFrom || cfg.mode !== 'deltaAboveAverage') {
        continue;
      }
      const base = this.sensors.get(cfg.derivedFrom);
      if (!base || base.status !== 'valid') {
        continue;
      }
      const history = this.derivedHistory.get(name) ?? [];
      history.push({ t: now, v: base.normalizedValue });
      const windowMs = cfg.windowMs ?? 10000;
      const filtered = history.filter((entry) => now - entry.t <= windowMs);
      this.derivedHistory.set(name, filtered);

      const avg = filtered.reduce((sum, entry) => sum + entry.v, 0) / Math.max(1, filtered.length);
      const delta = Math.max(0, base.normalizedValue - avg);
      const normalized = this.normalize(delta, cfg);
      const prev = this.sensors.get(name);
      const smoothed = this.applySmoothing(prev?.normalizedValue, normalized, cfg);
      const next: SensorValue = {
        name,
        normalizedValue: smoothed,
        convertedValue: delta,
        rawValue: delta,
        timestamp: now,
        status: 'valid',
      };
      if (!prev || Math.abs((prev.normalizedValue ?? 0) - smoothed) > 0.0001) {
        this.sensors.set(name, next);
        changed = true;
      }
    }
    return changed;
  }

  private normalize(value: number, cfg: SensorConfig): number {
    const mode = cfg.normalize.mode ?? 'linear';
    if (mode === 'bipolar') {
      const min = cfg.normalize.min;
      const max = cfg.normalize.max;
      const span = Math.max(Math.abs(min), Math.abs(max));
      const bipolar = Math.max(-1, Math.min(1, value / span));
      return (bipolar + 1) / 2;
    }
    if (mode === 'bipolarCircular') {
      const pi = Math.PI;
      let wrapped = value;
      while (wrapped > pi) wrapped -= 2 * pi;
      while (wrapped < -pi) wrapped += 2 * pi;
      return (wrapped + pi) / (2 * pi);
    }
    const linear = normalizeLinear(value, cfg.normalize.min, cfg.normalize.max);
    const curved = applyCurve(linear, cfg.normalize.curve ?? 'linear');
    return cfg.normalize.invert ? 1 - curved : curved;
  }

  private applySmoothing(previous: number | undefined, next: number, cfg: SensorConfig): number {
    const smoothing = cfg.smoothing;
    if (!smoothing || previous === undefined) {
      return next;
    }
    const alpha = Math.max(0, Math.min(1, smoothing.alpha));
    return previous + alpha * (next - previous);
  }

  private sensorStatusFromNumber(value: number): SensorStatus {
    return Number.isFinite(value) ? 'valid' : 'invalid';
  }

  private emitState(): void {
    this.emit('state', this.getState());
  }
}
