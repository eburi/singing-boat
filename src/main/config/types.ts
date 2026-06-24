export interface SensorConfig {
  path?: string;
  derivedFrom?: string;
  mode?: 'deltaAboveAverage';
  windowMs?: number;
  sourceUnits?: string;
  displayUnits?: string;
  normalize: {
    min: number;
    max: number;
    curve?: string;
    invert?: boolean;
    mode?: 'bipolar' | 'bipolarCircular' | 'linear';
  };
  smoothing?: {
    type: 'ema' | 'emaCircular';
    alpha: number;
  };
  deadband?: number;
  staleAfterMs?: number;
}

export interface AppConfig {
  version: number;
  app: {
    name: string;
    randomSeed: string;
  };
  signalk: {
    enabled: boolean;
    protocol: 'ws' | 'wss';
    host: string;
    port: number;
    version: string;
    subscribe: 'self' | 'all' | 'none';
    token: string | null;
    reconnect: {
      minDelayMs: number;
      maxDelayMs: number;
      jitter: boolean;
    };
    stalePolicy: {
      defaultStaleAfterMs: number;
      onDisconnect: 'hold' | 'fade_then_silence' | 'panic';
      fadeMs: number;
    };
  };
  midi: {
    output: {
      mode: 'selected_or_virtual' | 'selected';
      preferredName: string;
      createVirtual: boolean;
    };
    panicOnStop: boolean;
    sendClock: boolean;
    channels: Record<string, number>;
  };
  clock: {
    bpm: {
      base: number;
      min: number;
      max: number;
      source: string;
      amount: number;
    };
    beatsPerBar: number;
    phraseLengthBars: number;
    swing: number;
  };
  sensors: Record<string, SensorConfig>;
  harmony: {
    key: string;
    mode: string;
    progression: {
      type: 'roman';
      chords: string[];
      advance: {
        mode: 'sensor_or_time' | 'time';
        sensor: string;
        thresholds: number[];
        barsPerChord: number;
      };
    };
    quantize: {
      enabled: boolean;
      allowPassingTones: boolean;
      passingToneProbability: number;
    };
    voiceLeading: {
      mode: 'commonTone' | 'nearest';
      maxLeapSemitones: number;
    };
    tension: {
      sources: Array<{ sensor: string; weight: number }>;
    };
  };
  motifs: Record<string, any>;
  arrangement: {
    level: 2;
    phraseLengthBars: number;
    transition: {
      defaultDurationMs: number;
      quantizeTo: 'beat' | 'bar' | 'phrase';
      mode: string;
    };
    scenes: Record<string, any>;
  };
  mappings: any[];
}
