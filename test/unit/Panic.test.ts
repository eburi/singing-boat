import { describe, expect, it } from 'vitest';
import { panic } from '../../src/main/midi/Panic';
import { MockMidiOutputAdapter } from '../../src/main/midi/MockMidiOutputAdapter';

describe('panic', () => {
  it('sends note offs and safety CC values', async () => {
    const adapter = new MockMidiOutputAdapter();
    await adapter.openOutput('mock-1');

    panic(
      adapter,
      [1, 2],
      [
        { channel: 1, note: 60 },
        { channel: 2, note: 48 },
      ],
    );

    const noteOffCount = adapter.sent.filter((entry) => entry.message.type === 'noteOff').length;
    const cc123Count = adapter.sent.filter((entry) => entry.message.type === 'cc' && entry.message.controller === 123).length;
    expect(noteOffCount).toBe(2);
    expect(cc123Count).toBe(2);
  });
});
