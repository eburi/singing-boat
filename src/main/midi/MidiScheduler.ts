import type { MidiOutputAdapter } from './MidiOutputAdapter';
import type { MidiMessage } from './MidiMessages';

type ActiveNote = { channel: number; note: number };

export class MidiScheduler {
  private activeNotes = new Set<string>();

  private monitorListeners: Array<(entry: { at: number; message: MidiMessage; source?: string }) => void> = [];

  constructor(private adapter: MidiOutputAdapter) {}

  send(message: MidiMessage, source?: string): void {
    const at = performance.now();
    this.track(message);
    this.adapter.send(message, at);
    for (const listener of this.monitorListeners) {
      listener({ at, message, source });
    }
  }

  schedule(message: MidiMessage, atMs: number, source?: string): void {
    const delay = Math.max(0, atMs - performance.now());
    setTimeout(() => {
      this.send(message, source);
    }, delay);
  }

  getActiveNotes(): ActiveNote[] {
    return [...this.activeNotes].map((entry) => {
      const [channel, note] = entry.split(':').map((s) => Number(s));
      return { channel, note };
    });
  }

  clearActiveNotes(): void {
    this.activeNotes.clear();
  }

  onMonitor(listener: (entry: { at: number; message: MidiMessage; source?: string }) => void): () => void {
    this.monitorListeners.push(listener);
    return () => {
      this.monitorListeners = this.monitorListeners.filter((item) => item !== listener);
    };
  }

  private track(message: MidiMessage): void {
    if (message.type === 'noteOn' && message.velocity > 0) {
      this.activeNotes.add(`${message.channel}:${message.note}`);
      return;
    }
    if (message.type === 'noteOff' || (message.type === 'noteOn' && message.velocity === 0)) {
      this.activeNotes.delete(`${message.channel}:${message.note}`);
    }
  }
}
