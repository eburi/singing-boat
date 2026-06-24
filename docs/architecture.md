# Architecture

## Main process

- Hosts runtime orchestration in `src/main/runtime.ts`.
- Owns configuration loading/validation (`ConfigService`).
- Owns Signal K WebSocket client and delta parsing.
- Owns world-state canonical store and stale detection.
- Owns music engines: arrangement, harmony, mapping, motif.
- Owns MIDI scheduler, panic logic, and adapter boundary.
- Exposes typed IPC handlers only.

## Renderer process

- React UI in `src/renderer/`.
- Panels: connection, sensors, config/mapping editor, harmony, arrangement, MIDI monitor.
- Uses preload-exposed typed API from `window.singingBoat`.
- No direct Node APIs, no native module access.

## Music engine flow

1. Signal K/simulator values are parsed and ingested.
2. `WorldStateStore` updates logical sensors, conversions, smoothing, normalization, staleness.
3. `MusicalStateEngine` updates clock, arrangement state, and harmony state.
4. `MappingEngine` emits control commands (CC/pitch-bend/program/motif triggers).
5. `MotifEngine` emits motif note events.
6. Harmony quantization applies before final note sends.
7. `MidiScheduler` tracks active notes and emits monitor stream.

## Config reload flow

1. Renderer sends new YAML.
2. Main validates schema and semantics.
3. Runtime applies next config in memory.
4. Services are reconfigured (`WorldStateStore`, `MusicalStateEngine`).
5. Removed layers trigger safe note cleanup (panic fallback).
6. On failure, previous config remains active.

## MIDI scheduling flow

- MIDI events are emitted through `MidiScheduler` only.
- Scheduler tracks active note-on/off state.
- Panic sends:
  - tracked note-offs,
  - CC 123 all-notes-off,
  - CC 120 all-sound-off,
  - CC 64 sustain reset,
  - pitch bend center.
- Scheduler provides monitor events for renderer observability.
