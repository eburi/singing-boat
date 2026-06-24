import { useEffect, useMemo, useState } from 'react';
import type { RuntimeSnapshot } from '../main/ipc/types';
import { api } from './api';
import { ConnectionPanel } from './components/ConnectionPanel';
import { SensorMonitor } from './components/SensorMonitor';
import { MappingEditor } from './components/MappingEditor';
import { HarmonyPanel } from './components/HarmonyPanel';
import { ArrangementPanel } from './components/ArrangementPanel';
import { MidiMonitor } from './components/MidiMonitor';
import { ConfigEditor } from './components/ConfigEditor';

const emptySnapshot: RuntimeSnapshot = {
  connectionState: 'disconnected',
  lastMessageAt: null,
  sensors: {},
  arrangement: {
    scene: 'calm',
    intensity: 0,
    tension: 0,
    density: 0,
    phrasePosition: 0,
    bar: 1,
    beat: 1,
    activeLayers: {},
    activeMotifs: [],
  },
  harmony: {
    key: 'D',
    mode: 'dorian',
    chord: 'i7',
    progressionIndex: 0,
    tension: 0,
    quantizeEnabled: true,
  },
  midiMonitor: [],
  selectedMidiPort: null,
};

export default function App(): JSX.Element {
  const [snapshot, setSnapshot] = useState<RuntimeSnapshot>(emptySnapshot);
  const [configText, setConfigText] = useState('');
  const [validationMessage, setValidationMessage] = useState('No validation yet.');

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    void api.subscribeRuntime((next) => {
      setSnapshot(next);
    }).then((cleanup) => {
      unsubscribe = cleanup;
    });
    void api.getConfig().then((text) => setConfigText(text));
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const lastUpdate = useMemo(() => (snapshot.lastMessageAt ? new Date(snapshot.lastMessageAt).toLocaleTimeString() : 'n/a'), [snapshot.lastMessageAt]);

  async function handleValidate(): Promise<void> {
    const result = await api.validateConfig(configText);
    setValidationMessage(result.ok ? 'Config valid.' : `Invalid: ${(result.errors ?? []).join('; ')}`);
  }

  async function handleApply(): Promise<void> {
    const result = await api.applyConfig(configText);
    setValidationMessage(result.ok ? 'Applied successfully.' : `Apply failed: ${(result.errors ?? []).join('; ')}`);
  }

  function handleExport(): void {
    const blob = new Blob([configText], { type: 'text/yaml' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'singing-boat-config.yaml';
    a.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>Singing Boat v1</h1>
          <p>Signal K to arranged deterministic MIDI performance.</p>
        </div>
        <div className="hero-status">
          <span>State: {snapshot.connectionState}</span>
          <span>Last update: {lastUpdate}</span>
          <button className="danger" onClick={() => void api.panic()}>
            Panic / Reset
          </button>
        </div>
      </header>

      <main className="layout">
        <ConnectionPanel
          connectionState={snapshot.connectionState}
          lastMessageAt={snapshot.lastMessageAt}
          selectedMidiPort={snapshot.selectedMidiPort}
        />
        <HarmonyPanel harmony={snapshot.harmony} />
        <ArrangementPanel arrangement={snapshot.arrangement} />
        <ConfigEditor onExport={handleExport} />
        <MappingEditor
          configText={configText}
          onConfigTextChange={setConfigText}
          onValidate={handleValidate}
          onApply={handleApply}
          validationMessage={validationMessage}
        />
        <SensorMonitor sensors={snapshot.sensors} />
        <MidiMonitor messages={snapshot.midiMonitor} />
      </main>
    </div>
  );
}
