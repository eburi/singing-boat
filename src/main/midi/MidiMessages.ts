export type MidiMessage =
  | { type: 'noteOn'; channel: number; note: number; velocity: number }
  | { type: 'noteOff'; channel: number; note: number; velocity?: number }
  | { type: 'cc'; channel: number; controller: number; value: number }
  | { type: 'programChange'; channel: number; program: number }
  | { type: 'pitchBend'; channel: number; value: number }
  | { type: 'clock' }
  | { type: 'start' }
  | { type: 'stop' }
  | { type: 'continue' };

export interface MidiPortInfo {
  id: string;
  name: string;
  virtual?: boolean;
}
