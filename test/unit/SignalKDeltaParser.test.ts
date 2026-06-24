import { describe, expect, it } from 'vitest';
import { parseSignalKDelta } from '../../src/main/signalk/SignalKDeltaParser';

describe('parseSignalKDelta', () => {
  it('parses numeric values only', () => {
    const values = parseSignalKDelta({
      updates: [
        {
          source: { label: 'demo' },
          timestamp: '2026-06-24T12:00:00.000Z',
          values: [
            { path: 'environment.wind.speedApparent', value: 8.4 },
            { path: 'bad.path', value: 'oops' as unknown as number },
          ],
        },
      ],
    });

    expect(values).toHaveLength(1);
    expect(values[0]).toMatchObject({
      path: 'environment.wind.speedApparent',
      value: 8.4,
      source: 'demo',
    });
  });
});
