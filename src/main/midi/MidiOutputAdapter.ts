import type { MidiMessage, MidiPortInfo } from './MidiMessages';

export interface MidiOutputAdapter {
  listOutputs(): Promise<MidiPortInfo[]>;
  openOutput(portId: string): Promise<void>;
  createVirtualOutput?(name: string): Promise<void>;
  send(message: MidiMessage, at?: number): void;
  close(): Promise<void>;
}
