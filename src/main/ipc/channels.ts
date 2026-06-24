export const ipcChannels = {
  appStatus: 'app:status',
  configGet: 'config:get',
  configValidate: 'config:validate',
  configApply: 'config:apply',
  midiListOutputs: 'midi:listOutputs',
  midiOpenOutput: 'midi:openOutput',
  midiCreateVirtual: 'midi:createVirtual',
  midiPanic: 'midi:panic',
  controlConnectSignalK: 'control:connectSignalK',
  controlDisconnectSignalK: 'control:disconnectSignalK',
  simulatorStart: 'simulator:start',
  simulatorStop: 'simulator:stop',
  simulatorOverride: 'simulator:override',
  subscribeRuntime: 'subscribe:runtime',
} as const;

export type IpcChannel = (typeof ipcChannels)[keyof typeof ipcChannels];
