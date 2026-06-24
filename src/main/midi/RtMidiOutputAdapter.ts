import { Output } from '@julusian/midi';
import type { MidiOutputAdapter } from './MidiOutputAdapter';
import type { MidiMessage, MidiPortInfo } from './MidiMessages';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toStatus(base: number, channel: number): number {
  return base | clamp(channel, 1, 16) - 1;
}

export class RtMidiOutputAdapter implements MidiOutputAdapter {
  private readonly output: Output;

  private isOpen = false;

  constructor() {
    this.output = new Output();
  }

  async listOutputs(): Promise<MidiPortInfo[]> {
    const count = this.output.getPortCount();
    const ports: MidiPortInfo[] = [];
    for (let i = 0; i < count; i += 1) {
      ports.push({ id: String(i), name: this.output.getPortName(i) });
    }
    return ports;
  }

  async openOutput(portId: string): Promise<void> {
    const index = Number(portId);
    if (!Number.isInteger(index) || index < 0 || index >= this.output.getPortCount()) {
      throw new Error(`Invalid MIDI output port id: ${portId}`);
    }
    this.closePortIfOpen();
    this.output.openPort(index);
    this.isOpen = true;
  }

  async createVirtualOutput(name: string): Promise<void> {
    this.closePortIfOpen();
    this.output.openVirtualPort(name);
    this.isOpen = true;
  }

  send(message: MidiMessage, at?: number): void {
    const dispatch = () => {
      const bytes = this.toBytes(message);
      if (bytes) {
        this.output.sendMessage(bytes);
      }
    };
    if (typeof at === 'number' && at > performance.now()) {
      setTimeout(dispatch, at - performance.now());
      return;
    }
    dispatch();
  }

  async close(): Promise<void> {
    this.closePortIfOpen();
  }

  private closePortIfOpen(): void {
    if (this.isOpen) {
      this.output.closePort();
      this.isOpen = false;
    }
  }

  private toBytes(message: MidiMessage): number[] | null {
    switch (message.type) {
      case 'noteOn':
        return [
          toStatus(0x90, message.channel),
          clamp(Math.round(message.note), 0, 127),
          clamp(Math.round(message.velocity), 0, 127),
        ];
      case 'noteOff':
        return [
          toStatus(0x80, message.channel),
          clamp(Math.round(message.note), 0, 127),
          clamp(Math.round(message.velocity ?? 0), 0, 127),
        ];
      case 'cc':
        return [
          toStatus(0xb0, message.channel),
          clamp(Math.round(message.controller), 0, 127),
          clamp(Math.round(message.value), 0, 127),
        ];
      case 'programChange':
        return [toStatus(0xc0, message.channel), clamp(Math.round(message.program), 0, 127)];
      case 'pitchBend': {
        const value14 = clamp(Math.round(message.value), 0, 16383);
        const lsb = value14 & 0x7f;
        const msb = (value14 >> 7) & 0x7f;
        return [toStatus(0xe0, message.channel), lsb, msb];
      }
      case 'clock':
        return [0xf8];
      case 'start':
        return [0xfa];
      case 'stop':
        return [0xfc];
      case 'continue':
        return [0xfb];
      default:
        return null;
    }
  }
}
