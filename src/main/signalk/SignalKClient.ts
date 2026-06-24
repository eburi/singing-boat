import WebSocket from 'ws';
import { parseSignalKDelta } from './SignalKDeltaParser';
import type { ParsedSignalKValue, SignalKClientOptions, SignalKConnectionState } from './types';

type ValueListener = (values: ParsedSignalKValue[]) => void;
type StateListener = (state: SignalKConnectionState) => void;

export class SignalKClient {
  private ws: WebSocket | null = null;

  private reconnectAttempt = 0;

  private stopRequested = false;

  private onValues: ValueListener;

  private onState: StateListener;

  constructor(private options: SignalKClientOptions, onValues: ValueListener, onState: StateListener) {
    this.onValues = onValues;
    this.onState = onState;
  }

  connect(): void {
    this.stopRequested = false;
    this.openSocket();
  }

  disconnect(): void {
    this.stopRequested = true;
    this.onState('disconnected');
    if (this.ws) {
      this.ws.terminate();
      this.ws = null;
    }
  }

  private openSocket(): void {
    const state: SignalKConnectionState = this.reconnectAttempt === 0 ? 'connecting' : 'reconnecting';
    this.onState(state);

    this.ws = new WebSocket(this.options.url, {
      headers: this.options.token ? { Authorization: `Bearer ${this.options.token}` } : undefined,
    });

    this.ws.on('open', () => {
      this.reconnectAttempt = 0;
      this.onState('connected');
    });

    this.ws.on('message', (raw) => {
      try {
        const json = JSON.parse(raw.toString()) as Record<string, unknown>;
        const values = parseSignalKDelta(json);
        if (values.length > 0) {
          this.onValues(values);
        }
      } catch {
        // ignore malformed frames
      }
    });

    this.ws.on('close', () => {
      this.ws = null;
      if (!this.stopRequested) {
        this.scheduleReconnect();
      }
    });

    this.ws.on('error', () => {
      // closed path handles reconnect
    });
  }

  private scheduleReconnect(): void {
    this.reconnectAttempt += 1;
    const base = Math.min(this.options.maxDelayMs, this.options.minDelayMs * 2 ** this.reconnectAttempt);
    const jitter = this.options.jitter ? Math.random() * this.options.minDelayMs : 0;
    const delay = Math.min(this.options.maxDelayMs, base + jitter);
    setTimeout(() => {
      if (!this.stopRequested) {
        this.openSocket();
      }
    }, delay);
  }
}
