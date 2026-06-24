import type { MidiOutputAdapter } from './MidiOutputAdapter';
import type { MidiMessage, MidiPortInfo } from './MidiMessages';

export class MockMidiOutputAdapter implements MidiOutputAdapter {
  public sent: Array<{ at: number; message: MidiMessage }> = [];

  private openedPortId: string | null = null;

  async listOutputs(): Promise<MidiPortInfo[]> {
    return [
      { id: 'mock-1', name: 'Mock Output 1' },
      { id: 'mock-virtual', name: 'Singing Boat Virtual', virtual: true },
    ];
  }

  async openOutput(portId: string): Promise<void> {
    this.openedPortId = portId;
  }

  async createVirtualOutput(_name: string): Promise<void> {
    this.openedPortId = 'mock-virtual';
  }

  send(message: MidiMessage, at?: number): void {
    if (!this.openedPortId) {
      return;
    }
    this.sent.push({ at: at ?? Date.now(), message });
  }

  async close(): Promise<void> {
    this.openedPortId = null;
  }
}
