import type { RuntimeSnapshot } from '../main/ipc/types';

export const api = {
  appStatus: () => window.singingBoat.appStatus(),
  getConfig: () => window.singingBoat.getConfig(),
  validateConfig: (text: string) => window.singingBoat.validateConfig(text),
  applyConfig: (text: string) => window.singingBoat.applyConfig(text),
  listMidiOutputs: () => window.singingBoat.listMidiOutputs(),
  openMidiOutput: (portId: string) => window.singingBoat.openMidiOutput(portId),
  createVirtualOutput: (name: string) => window.singingBoat.createVirtualOutput(name),
  panic: () => window.singingBoat.panic(),
  connectSignalK: () => window.singingBoat.connectSignalK(),
  disconnectSignalK: () => window.singingBoat.disconnectSignalK(),
  startSimulator: (profile: string) => window.singingBoat.startSimulator(profile),
  stopSimulator: () => window.singingBoat.stopSimulator(),
  setSimulatorOverride: (sensor: string, value: number | null) => window.singingBoat.setSimulatorOverride(sensor, value),
  subscribeRuntime: (listener: (snapshot: RuntimeSnapshot) => void) => window.singingBoat.subscribeRuntime(listener),
};
