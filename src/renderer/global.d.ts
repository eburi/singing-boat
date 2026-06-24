export {};

declare global {
  interface Window {
    singingBoat: {
      appStatus(): Promise<any>;
      getConfig(): Promise<string>;
      validateConfig(text: string): Promise<{ ok: boolean; errors?: string[] }>;
      applyConfig(text: string): Promise<{ ok: boolean; errors?: string[] }>;
      listMidiOutputs(): Promise<Array<{ id: string; name: string; virtual?: boolean }>>;
      openMidiOutput(portId: string): Promise<void>;
      createVirtualOutput(name: string): Promise<void>;
      panic(): Promise<void>;
      connectSignalK(): Promise<void>;
      disconnectSignalK(): Promise<void>;
      startSimulator(profile: string): Promise<void>;
      stopSimulator(): Promise<void>;
      setSimulatorOverride(sensor: string, value: number | null): Promise<void>;
      subscribeRuntime(listener: (snapshot: any) => void): Promise<() => void>;
    };
  }
}
