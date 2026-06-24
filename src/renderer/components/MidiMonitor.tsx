import type { MidiMessage } from '../../main/midi/MidiMessages';

type Entry = { at: number; message: MidiMessage; source?: string };

type Props = {
  messages: Entry[];
};

function renderMessage(msg: MidiMessage): string {
  if ('channel' in msg) {
    if (msg.type === 'noteOn' || msg.type === 'noteOff') {
      return `${msg.type} ch${msg.channel} note:${msg.note} vel:${msg.velocity ?? 0}`;
    }
    if (msg.type === 'cc') {
      return `cc ch${msg.channel} cc:${msg.controller} value:${msg.value}`;
    }
    if (msg.type === 'pitchBend') {
      return `pitchBend ch${msg.channel} value:${msg.value}`;
    }
    if (msg.type === 'programChange') {
      return `programChange ch${msg.channel} program:${msg.program}`;
    }
  }
  return msg.type;
}

export function MidiMonitor({ messages }: Props): JSX.Element {
  const rows = messages.slice(-120).reverse();
  return (
    <section className="panel">
      <h2>MIDI Monitor</h2>
      <ul className="list monitor">
        {rows.map((entry, index) => (
          <li key={`${entry.at}-${index}`}>
            <span>{new Date(entry.at).toLocaleTimeString()}</span>
            <code>{renderMessage(entry.message)}</code>
            <em>{entry.source ?? '-'}</em>
          </li>
        ))}
      </ul>
    </section>
  );
}
