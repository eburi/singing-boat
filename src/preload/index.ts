import { contextBridge, ipcRenderer } from 'electron';
import { ipcChannels } from '../main/ipc/channels';
import type { RuntimeSnapshot } from '../main/ipc/types';

type RuntimeListener = (snapshot: RuntimeSnapshot) => void;

const api = {
  appStatus: () => ipcRenderer.invoke(ipcChannels.appStatus),
  getConfig: () => ipcRenderer.invoke(ipcChannels.configGet),
  validateConfig: (text: string) => ipcRenderer.invoke(ipcChannels.configValidate, text),
  applyConfig: (text: string) => ipcRenderer.invoke(ipcChannels.configApply, text),

  listMidiOutputs: () => ipcRenderer.invoke(ipcChannels.midiListOutputs),
  openMidiOutput: (portId: string) => ipcRenderer.invoke(ipcChannels.midiOpenOutput, portId),
  createVirtualOutput: (name: string) => ipcRenderer.invoke(ipcChannels.midiCreateVirtual, name),
  panic: () => ipcRenderer.invoke(ipcChannels.midiPanic),

  connectSignalK: () => ipcRenderer.invoke(ipcChannels.controlConnectSignalK),
  disconnectSignalK: () => ipcRenderer.invoke(ipcChannels.controlDisconnectSignalK),

  startSimulator: (profile: string) => ipcRenderer.invoke(ipcChannels.simulatorStart, profile),
  stopSimulator: () => ipcRenderer.invoke(ipcChannels.simulatorStop),
  setSimulatorOverride: (sensor: string, value: number | null) => ipcRenderer.invoke(ipcChannels.simulatorOverride, { sensor, value }),

  subscribeRuntime: async (listener: RuntimeListener) => {
    const initial = (await ipcRenderer.invoke(ipcChannels.subscribeRuntime)) as RuntimeSnapshot;
    listener(initial);
    const wrapped = (_event: unknown, snapshot: RuntimeSnapshot) => listener(snapshot);
    ipcRenderer.on(ipcChannels.subscribeRuntime, wrapped);
    return () => {
      ipcRenderer.removeListener(ipcChannels.subscribeRuntime, wrapped);
    };
  },
};

contextBridge.exposeInMainWorld('singingBoat', api);

declare global {
  interface Window {
    singingBoat: typeof api;
  }
}
