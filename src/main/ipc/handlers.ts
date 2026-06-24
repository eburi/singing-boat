import { BrowserWindow, ipcMain } from 'electron';
import { ipcChannels } from './channels';
import type { RuntimeSnapshot } from './types';
import type { AppRuntime } from '../runtime';

export function registerIpcHandlers(runtime: AppRuntime): void {
  ipcMain.handle(ipcChannels.appStatus, () => runtime.getStatus());
  ipcMain.handle(ipcChannels.configGet, () => runtime.getConfigYaml());
  ipcMain.handle(ipcChannels.configValidate, (_event, text: string) => runtime.validateConfigText(text));
  ipcMain.handle(ipcChannels.configApply, (_event, text: string) => runtime.applyConfigText(text));

  ipcMain.handle(ipcChannels.midiListOutputs, () => runtime.listMidiOutputs());
  ipcMain.handle(ipcChannels.midiOpenOutput, (_event, portId: string) => runtime.openMidiOutput(portId));
  ipcMain.handle(ipcChannels.midiCreateVirtual, (_event, name: string) => runtime.createVirtualMidi(name));
  ipcMain.handle(ipcChannels.midiPanic, () => runtime.panic());

  ipcMain.handle(ipcChannels.controlConnectSignalK, () => runtime.connectSignalK());
  ipcMain.handle(ipcChannels.controlDisconnectSignalK, () => runtime.disconnectSignalK());

  ipcMain.handle(ipcChannels.simulatorStart, (_event, profile: string) => runtime.startSimulator(profile as any));
  ipcMain.handle(ipcChannels.simulatorStop, () => runtime.stopSimulator());
  ipcMain.handle(ipcChannels.simulatorOverride, (_event, payload: { sensor: string; value: number | null }) =>
    runtime.setSimulatorOverride(payload.sensor, payload.value),
  );

  ipcMain.handle(ipcChannels.subscribeRuntime, (event) => {
    const sender = event.sender;
    const push = (snapshot: RuntimeSnapshot) => {
      sender.send(ipcChannels.subscribeRuntime, snapshot);
    };
    const unsubscribe = runtime.subscribe(push);
    sender.once('destroyed', () => unsubscribe());
    return runtime.getRuntimeSnapshot();
  });
}

export function pushRuntimeSnapshot(window: BrowserWindow, snapshot: RuntimeSnapshot): void {
  window.webContents.send(ipcChannels.subscribeRuntime, snapshot);
}
