# Singing Boat v1

Singing Boat is a desktop Node/Electron app that turns Signal K vessel/environment state into deterministic arranged MIDI output.

## What v1 does

- Connects to Signal K over WebSocket (or run in simulator mode).
- Normalizes and smooths configured logical sensors.
- Builds musical intent with harmony, motif, and Level 2 arrangement engines.
- Sends MIDI note/CC/program-change/pitch-bend output through an abstracted MIDI adapter.
- Provides live UI panels for connection, sensors, harmony, arrangement, config editing, MIDI monitor, and panic.
- Supports hot config apply with validation and rollback.

## What v1 does not do

- Audio synthesis or playback.
- DAW playlist/clip arrangement control.
- Auto-DJ behavior.
- Cloud/LLM realtime musical decision-making.

## Quickstart (simulator)

1. Install dependencies:

   `npm install`

2. Start the app:

   `npm run dev`

3. In the app, click `Simulator` in the Connection panel.
4. Select/open a MIDI output and route it to your DAW input.
5. Use `Panic / Reset` anytime to silence all notes and reset channels.

## Quickstart (Signal K)

1. Ensure Signal K server is reachable at the configured endpoint (default `ws://localhost:3000/signalk/v1/stream?subscribe=self`).
2. Start app with `npm run dev`.
3. Click `Connect` in Connection panel.
4. Confirm live sensor updates and arrangement/harmony changes.

## Quickstart (DAW MIDI input)

- macOS: enable IAC Driver or use app-created virtual output.
- Windows: install/use loopMIDI and open that port from app.
- In DAW, enable the selected MIDI input and arm a MIDI track.

## Scripts

- `npm run dev` — run Electron + renderer in development.
- `npm run typecheck` — strict TypeScript checks.
- `npm run test` — unit/integration tests.
- `npm run build` — production build.
- `npm run package` — package app directory build.
- `npm run make` — create installers/artifacts.

## Key Paths

- Main process core: `src/main/`
- Preload bridge: `src/preload/index.ts`
- Renderer UI: `src/renderer/`
- Examples: `examples/configs/`, `examples/signalk/`
- Tests: `test/unit/`, `test/integration/`
- Docs: `docs/`
