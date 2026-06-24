import type { SensorValue } from './SensorValue';

export function getNormalizedSensor(state: Map<string, SensorValue>, name: string): number {
  return state.get(name)?.normalizedValue ?? 0;
}

export function isSensorValid(state: Map<string, SensorValue>, name: string): boolean {
  return state.get(name)?.status === 'valid';
}
