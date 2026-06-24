import type { ParsedSignalKValue, SignalKDelta } from './types';

export function parseSignalKDelta(delta: SignalKDelta): ParsedSignalKValue[] {
  const parsed: ParsedSignalKValue[] = [];
  for (const update of delta.updates ?? []) {
    const ts = update.timestamp ? Date.parse(update.timestamp) : Date.now();
    for (const entry of update.values ?? []) {
      if (typeof entry.path !== 'string' || typeof entry.value !== 'number' || Number.isNaN(entry.value)) {
        continue;
      }
      parsed.push({
        path: entry.path,
        value: entry.value,
        timestamp: ts,
        source: update.source?.label,
      });
    }
  }
  return parsed;
}
