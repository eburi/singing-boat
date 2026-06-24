import { useEffect, useState } from 'react';
import { api } from '../api';

type Props = {
  connectionState: string;
  lastMessageAt: number | null;
  selectedMidiPort: string | null;
};

export function ConnectionPanel({ connectionState, lastMessageAt, selectedMidiPort }: Props): JSX.Element {
  const [midiPorts, setMidiPorts] = useState<Array<{ id: string; name: string; virtual?: boolean }>>([]);

  useEffect(() => {
    void refreshMidiPorts();
  }, []);

  async function refreshMidiPorts(): Promise<void> {
    setMidiPorts(await api.listMidiOutputs());
  }

  return (
    <section className="panel">
      <h2>Connection</h2>
      <div className="grid two">
        <div>
          <label>Signal K State</label>
          <div className={`status status-${connectionState}`}>{connectionState}</div>
        </div>
        <div>
          <label>Last Message</label>
          <div>{lastMessageAt ? `${Math.round((Date.now() - lastMessageAt) / 1000)}s ago` : 'n/a'}</div>
        </div>
      </div>

      <div className="row">
        <button onClick={() => void api.connectSignalK()}>Connect</button>
        <button onClick={() => void api.disconnectSignalK()}>Disconnect</button>
        <button onClick={() => void api.startSimulator('steady_sailing')}>Simulator</button>
      </div>

      <h3>MIDI Output</h3>
      <div className="row">
        <button onClick={() => void refreshMidiPorts()}>Refresh MIDI Ports</button>
        <button onClick={() => void api.createVirtualOutput('Singing Boat')}>Create Virtual</button>
      </div>
      <div className="selected">Selected: {selectedMidiPort ?? 'none'}</div>
      <ul className="list compact">
        {midiPorts.map((port) => (
          <li key={port.id}>
            <button className="link" onClick={() => void api.openMidiOutput(port.id)}>
              {port.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
