import type { MidiOutputAdapter } from './MidiOutputAdapter';

export function panic(adapter: MidiOutputAdapter, activeChannels: number[], activeNotes: Array<{ channel: number; note: number }>): void {
  for (const note of activeNotes) {
    adapter.send({ type: 'noteOff', channel: note.channel, note: note.note, velocity: 0 });
  }

  const channels = activeChannels.length > 0 ? activeChannels : Array.from({ length: 16 }, (_, i) => i + 1);
  for (const channel of channels) {
    adapter.send({ type: 'cc', channel, controller: 123, value: 0 });
    adapter.send({ type: 'cc', channel, controller: 120, value: 0 });
    adapter.send({ type: 'cc', channel, controller: 64, value: 0 });
    adapter.send({ type: 'pitchBend', channel, value: 8192 });
  }
}
