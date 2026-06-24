export interface SignalKDeltaValue {
  path: string;
  value: unknown;
}

export interface SignalKDeltaUpdate {
  source?: { label?: string };
  timestamp?: string;
  values?: SignalKDeltaValue[];
}

export interface SignalKDelta {
  context?: string;
  updates?: SignalKDeltaUpdate[];
}

export interface ParsedSignalKValue {
  path: string;
  value: number;
  timestamp: number;
  source?: string;
}

export type SignalKConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface SignalKClientOptions {
  url: string;
  token?: string | null;
  minDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
}
