import { EventEmitter } from 'node:events';
import type { ParsedSignalKValue } from '../signalk/types';
import type { SimulatorProfile } from './presets';

export class Simulator extends EventEmitter {
  private timer: NodeJS.Timeout | null = null;

  private t = 0;

  private profile: SimulatorProfile = 'steady_sailing';

  private manualOverrides: Record<string, number> = {};

  start(profile: SimulatorProfile): void {
    this.stop();
    this.profile = profile;
    this.timer = setInterval(() => {
      this.t += 0.2;
      const values = this.generate();
      this.emit('values', values);
    }, 200);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  setManualOverride(sensor: string, value: number | null): void {
    if (value === null) {
      delete this.manualOverrides[sensor];
      return;
    }
    this.manualOverrides[sensor] = value;
  }

  private generate(): ParsedSignalKValue[] {
    const now = Date.now();
    const base = this.profileValues(this.profile, this.t);
    const withOverrides = { ...base, ...this.manualOverrides };
    return [
      { path: 'environment.wind.speedApparent', value: withOverrides.windSpeed, timestamp: now, source: 'simulator' },
      { path: 'environment.wind.angleApparent', value: withOverrides.windAngle, timestamp: now, source: 'simulator' },
      { path: 'navigation.speedThroughWater', value: withOverrides.boatSpeed, timestamp: now, source: 'simulator' },
      { path: 'navigation.depth.belowTransducer', value: withOverrides.depth, timestamp: now, source: 'simulator' },
      { path: 'navigation.attitude.roll', value: withOverrides.heel, timestamp: now, source: 'simulator' },
    ];
  }

  private profileValues(profile: SimulatorProfile, t: number): Record<string, number> {
    if (profile === 'calm_harbor') {
      return {
        windSpeed: 1 + Math.sin(t * 0.2) * 0.2,
        windAngle: Math.sin(t * 0.05) * 0.2,
        boatSpeed: 0.3 + Math.sin(t * 0.1) * 0.1,
        depth: 12 + Math.sin(t * 0.07),
        heel: Math.sin(t * 0.1) * 0.05,
      };
    }
    if (profile === 'gusty_reach') {
      return {
        windSpeed: 8 + Math.sin(t * 0.9) * 3 + Math.max(0, Math.sin(t * 3.2)) * 2,
        windAngle: Math.sin(t * 0.8) * 1.2,
        boatSpeed: 3.2 + Math.sin(t * 0.5) * 0.8,
        depth: 18 + Math.sin(t * 0.2) * 2,
        heel: Math.sin(t * 1.4) * 0.45,
      };
    }
    if (profile === 'shallow_approach') {
      return {
        windSpeed: 4 + Math.sin(t * 0.3) * 0.8,
        windAngle: Math.sin(t * 0.6) * 0.9,
        boatSpeed: 1.8 + Math.sin(t * 0.3) * 0.4,
        depth: 4 + Math.sin(t * 0.2) * 1.8,
        heel: Math.sin(t * 0.5) * 0.2,
      };
    }
    return {
      windSpeed: 5 + Math.sin(t * 0.4) * 1.2,
      windAngle: Math.sin(t * 0.35) * 1.0,
      boatSpeed: 2.2 + Math.sin(t * 0.25) * 0.5,
      depth: 15 + Math.sin(t * 0.12) * 2,
      heel: Math.sin(t * 0.5) * 0.22,
    };
  }
}
