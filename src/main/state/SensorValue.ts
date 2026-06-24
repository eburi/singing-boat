export type SensorStatus = 'valid' | 'stale' | 'missing' | 'invalid';

export interface SensorValue {
  name: string;
  path?: string;
  rawValue?: number;
  convertedValue?: number;
  normalizedValue: number;
  source?: string;
  timestamp?: number;
  status: SensorStatus;
}
