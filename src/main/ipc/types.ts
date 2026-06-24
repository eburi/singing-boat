import type { ArrangementState, HarmonyState } from '../music/types';
import type { SensorValue } from '../state/SensorValue';
import type { SignalKConnectionState } from '../signalk/types';
import type { MidiMessage } from '../midi/MidiMessages';

export interface RuntimeSnapshot {
  connectionState: SignalKConnectionState;
  lastMessageAt: number | null;
  sensors: Record<string, SensorValue>;
  arrangement: ArrangementState;
  harmony: HarmonyState;
  midiMonitor: Array<{ at: number; message: MidiMessage; source?: string }>;
  selectedMidiPort: string | null;
}

export interface AppStatus {
  appName: string;
  version: string;
  signalKEnabled: boolean;
}
