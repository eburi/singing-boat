# INSTRUCTIONS.md — Singing Boat v1

## Project Mission

Build **Singing Boat v1**, a desktop Node.js application packaged with Electron or a comparable desktop shell.

The application connects to a Signal K server, consumes selected vessel/environment state over WebSocket, transforms that state into deterministic musical intent, applies harmonisation and Level 2 arrangement control, and emits MIDI to a DAW or virtual MIDI port.

The first version is **SignalK → musical state → arranged MIDI output**.

It is not an audio engine, not a DAW, not a playlist controller, and not an auto-DJ.

---

## Product Summary

Singing Boat turns boat state into a continuous musical performance.

Example mappings:

- Apparent wind speed changes intensity, rhythmic density, velocity, and arrangement layer activation.
- Apparent wind angle selects scale degree, melodic contour, or motif variant.
- Boat speed controls tempo or pulse rate.
- Depth influences register, bass movement, or warning motifs.
- Heel/roll controls harmonic tension, pitch bend, modulation, or dissonance amount.
- Gusts trigger accents, fills, or short motifs.
- Configuration changes are applied live with smooth musical transitions and no stuck MIDI notes.

The application should be useful with FL Studio, Ableton Live, Logic, Bitwig, Reaper, or any DAW that can receive MIDI.

---

## Version Scope

### Version

Implement **v1.0.0**.

### Target maturity

Implement up to **Level 2: Arrangement Control**.

### In scope

- Desktop app based on Node.js and Electron or equivalent.
- TypeScript implementation.
- Signal K WebSocket client.
- Optional Signal K REST discovery for available paths.
- Live vessel state model.
- Sensor normalization, smoothing, deadbands, clamping, and unit conversion.
- Configurable Signal K path → MIDI mappings.
- Deterministic harmony engine.
- Deterministic motif engine.
- Level 2 arrangement control.
- MIDI output to a selected MIDI output port.
- Virtual MIDI output where the platform and MIDI backend support it.
- macOS as primary target.
- Windows as secondary target.
- Simulator mode for development without a live Signal K server.
- Renderer UI for configuration, monitoring, validation, and panic/reset.
- Hot-reload of configuration without app restart.
- Smooth transitions between configurations.
- Automated unit and integration tests.
- Basic packaged builds.

### Explicitly out of scope for v1

- Auto-DJ mode.
- Playlist steering.
- DAW playlist/arrangement timeline control.
- LLM or agent-driven realtime music decisions.
- Cloud services.
- Audio synthesis.
- Audio file playback.
- OSC output.
- Signal K server plugin packaging.
- Copyrighted Loom melodies, exact motifs, game assets, recordings, or proprietary harmonic material.
- Any dependency on a specific DAW.

---

## Arrangement-Control Levels

Use these definitions throughout the implementation.

### Level 0 — Raw Mapping

A Signal K value maps directly to a MIDI value.

Examples:

- Wind speed → MIDI CC 11.
- Heel angle → pitch bend.
- Depth → note velocity.

### Level 1 — Musical Mapping

Signal K values are mapped into musical structures.

Examples:

- Wind angle → scale degree.
- Wind speed → note density.
- Boat speed → tempo.
- Depth → bass register.
- Heel → harmonic tension.

### Level 2 — Arrangement Control

The app maintains an arrangement state and controls musical layers, scenes, motifs, density, and harmonic progression.

Required v1 examples:

- Current scene such as `calm`, `steady_sailing`, `gusty`, `fast_reach`, `shallow_water`, `maneuver`, or `harbor`.
- Active/inactive layers such as drone, pulse, bass, melody, arpeggio, event motif, and warning motif.
- Arrangement intensity derived from boat/environment state.
- Harmonic tension derived from heel, gusts, shallow depth, or manually configured paths.
- Quantized phrase-aware changes.
- Smooth scene transitions.
- Musical continuity across config reloads.

Level 2 does **not** mean controlling a DAW playlist or arranging audio clips. It means the bridge controls the arrangement of the generated MIDI performance.

---

## Architectural Principles

1. **The bridge owns musical intent.**
   The DAW renders, constrains, layers, and mixes the sound, but the app must maintain the high-level musical state.

2. **Realtime decisions must be deterministic.**
   Do not use an LLM, remote model, or non-deterministic service in the realtime path.

3. **Configuration is data.**
   Musical behaviour must be configurable without code changes.

4. **Hot reload must be safe.**
   Applying a new config must not produce stuck notes, abrupt jumps, or invalid MIDI state.

5. **MIDI output must be backend-abstracted.**
   The application must not leak a specific MIDI library into the musical engines.

6. **The renderer is not trusted.**
   Keep Signal K tokens, filesystem access, MIDI access, and native modules in the main process.

7. **Original music only.**
   Provide Loom-inspired game-music-style concepts only as generic configurable motifs and harmony systems. Do not copy Loom content.

---

## Recommended Technology Stack

Use this stack unless the existing repository already dictates otherwise.

### Runtime and language

- Node.js, current LTS or newer.
- TypeScript with `strict: true`.
- ESM modules.

### Desktop shell

- Electron.
- Electron Forge or electron-builder for packaging.
- Vite for renderer development.

### Renderer

Use a minimal renderer stack:

- React + Vite, or Svelte + Vite.
- Prefer simple components over a heavy UI framework.
- UI must communicate with the main process via typed IPC only.

### MIDI

Create a MIDI abstraction and implement one native backend first.

Preferred backend:

- `@julusian/midi` or another actively maintained RtMidi-based Node package.

Requirements:

- List MIDI output ports.
- Open selected output port.
- Create virtual output port if supported by backend/platform.
- Send note on/off, CC, program change, pitch bend, and optional MIDI clock.
- Provide a mock backend for tests and simulator mode.

Platform notes:

- On macOS, support either the IAC Driver or app-created virtual ports where possible.
- On Windows, do not assume native virtual MIDI loopback is available. Allow the user to select an existing port such as loopMIDI.
- On Linux, ALSA/JACK support is desirable but not required for v1 acceptance.

### Music theory

Use Tonal.js packages for:

- Notes.
- Intervals.
- Scales.
- Modes.
- Chords.
- Roman numeral progression resolution.
- Transposition.

Wrap Tonal.js behind local domain modules so it can be replaced later if necessary.

### Config and validation

- YAML or JSON config files.
- Zod schemas for validation.
- Versioned config schema.
- Clear validation errors shown in the UI.

### Testing

- Vitest for unit and integration tests.
- Playwright only if renderer E2E tests remain lightweight.
- MIDI mock snapshots for deterministic generated output.

---

## High-Level Architecture

```text
Signal K Server
    ↓ WebSocket delta stream
SignalKClient
    ↓
WorldStateStore
    ↓
Normalization + Smoothing
    ↓
MusicalStateEngine
    ├── HarmonyEngine
    ├── MotifEngine
    └── ArrangementEngine
            ↓
MappingEngine
    ↓
MidiScheduler
    ↓
MidiOutputAdapter
    ↓
Virtual / physical MIDI port
    ↓
DAW / synth / sampler
```

Electron split:

```text
Main Process
  Signal K connection
  Config service
  Music engines
  MIDI scheduler/output
  File IO
  Native modules
  IPC API

Renderer Process
  Connection dashboard
  Live sensor monitor
  MIDI monitor
  Config editor
  Mapping editor
  Harmony/arrangement state view
  Panic/reset controls
```

---

## Repository Structure

Create or adapt the repository to this structure:

```text
.
├── INSTRUCTIONS.md
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── electron.vite.config.ts              # if using electron-vite
├── forge.config.ts                      # if using Electron Forge
├── src
│   ├── main
│   │   ├── index.ts
│   │   ├── ipc
│   │   │   ├── channels.ts
│   │   │   ├── handlers.ts
│   │   │   └── types.ts
│   │   ├── signalk
│   │   │   ├── SignalKClient.ts
│   │   │   ├── SignalKDeltaParser.ts
│   │   │   ├── SignalKDiscovery.ts
│   │   │   └── types.ts
│   │   ├── state
│   │   │   ├── WorldStateStore.ts
│   │   │   ├── SensorValue.ts
│   │   │   └── selectors.ts
│   │   ├── config
│   │   │   ├── ConfigService.ts
│   │   │   ├── ConfigSchema.ts
│   │   │   ├── defaults.ts
│   │   │   ├── migrations.ts
│   │   │   └── types.ts
│   │   ├── music
│   │   │   ├── MusicalStateEngine.ts
│   │   │   ├── HarmonyEngine.ts
│   │   │   ├── MotifEngine.ts
│   │   │   ├── ArrangementEngine.ts
│   │   │   ├── MappingEngine.ts
│   │   │   ├── SchedulerClock.ts
│   │   │   └── types.ts
│   │   ├── midi
│   │   │   ├── MidiOutputAdapter.ts
│   │   │   ├── RtMidiOutputAdapter.ts
│   │   │   ├── MockMidiOutputAdapter.ts
│   │   │   ├── MidiScheduler.ts
│   │   │   ├── MidiMessages.ts
│   │   │   └── Panic.ts
│   │   ├── simulator
│   │   │   ├── Simulator.ts
│   │   │   ├── presets.ts
│   │   │   └── recordedDeltas.ts
│   │   └── utils
│   │       ├── math.ts
│   │       ├── time.ts
│   │       ├── units.ts
│   │       └── seededRandom.ts
│   ├── preload
│   │   └── index.ts
│   └── renderer
│       ├── main.tsx
│       ├── App.tsx
│       ├── api.ts
│       ├── components
│       │   ├── ConnectionPanel.tsx
│       │   ├── SensorMonitor.tsx
│       │   ├── MappingEditor.tsx
│       │   ├── HarmonyPanel.tsx
│       │   ├── ArrangementPanel.tsx
│       │   ├── MidiMonitor.tsx
│       │   └── ConfigEditor.tsx
│       └── styles.css
├── test
│   ├── unit
│   ├── integration
│   └── fixtures
├── examples
│   ├── configs
│   │   ├── basic-wind-to-midi.yaml
│   │   ├── level2-arrangement.yaml
│   │   └── shallow-water-warning.yaml
│   └── signalk
│       ├── demo-deltas.jsonl
│       └── simulator-profile.yaml
└── docs
    ├── architecture.md
    ├── midi-routing-macos.md
    ├── midi-routing-windows.md
    └── config-reference.md
```

---

## Signal K Integration

### WebSocket endpoint

Connect to:

```text
ws://<host>:<port>/signalk/v1/stream?subscribe=self
```

Allow configuration of:

- Host.
- Port.
- Protocol: `ws` or `wss`.
- API version, default `v1`.
- Subscription mode: `self`, `all`, or `none` plus explicit subscriptions.
- Authentication token if required.

### Subscriptions

Open one WebSocket connection and subscribe only to configured paths where possible.

Required baseline paths for examples:

```text
environment.wind.speedApparent
environment.wind.angleApparent
navigation.speedThroughWater
navigation.speedOverGround
navigation.courseOverGroundTrue
navigation.headingTrue
navigation.depth.belowTransducer
navigation.attitude.roll
navigation.attitude.pitch
environment.depth.belowTransducer
```

Do not fail if a path is absent. Mark missing paths as unavailable and continue.

### Delta parsing

Implement support for Signal K delta updates:

```json
{
  "context": "vessels.self",
  "updates": [
    {
      "source": { "label": "demo" },
      "timestamp": "2026-06-24T12:00:00.000Z",
      "values": [
        {
          "path": "environment.wind.speedApparent",
          "value": 8.4
        }
      ]
    }
  ]
}
```

Store for each value:

- Signal K path.
- Raw value.
- Converted value.
- Timestamp.
- Source label if present.
- Staleness status.
- Validity status.

### Reconnect behaviour

- Exponential backoff with jitter.
- UI-visible connection state.
- Do not emit stale notes indefinitely if the Signal K connection is lost.
- Configurable stale timeout per sensor.
- On disconnect, either hold, fade, or panic depending on config.

---

## World State Model

Implement `WorldStateStore` as the canonical current state.

Responsibilities:

- Maintain latest value per Signal K path.
- Maintain derived logical sensors defined in config.
- Track staleness.
- Provide normalized values in `[0, 1]`.
- Publish typed state-change events to the music engine.

Derived sensor example:

```yaml
sensors:
  windSpeed:
    path: environment.wind.speedApparent
    sourceUnits: m/s
    displayUnits: kn
    normalize:
      min: 0
      max: 20
      curve: easeInOut
    smoothing:
      type: ema
      alpha: 0.12
    staleAfterMs: 5000

  heel:
    path: navigation.attitude.roll
    sourceUnits: rad
    displayUnits: deg
    normalize:
      min: -0.7
      max: 0.7
      center: 0
      mode: bipolar
    smoothing:
      type: ema
      alpha: 0.2
    deadband: 0.02
```

### Unit conversion

Implement at least:

- m/s ↔ knots.
- radians ↔ degrees.
- metres unchanged.
- ratio/bipolar normalized values.

Keep raw SI values available.

---

## MIDI Output

### MIDI abstraction

Define an interface similar to:

```ts
export interface MidiOutputAdapter {
  listOutputs(): Promise<MidiPortInfo[]>;
  openOutput(portId: string): Promise<void>;
  createVirtualOutput?(name: string): Promise<void>;
  send(message: MidiMessage, at?: number): void;
  close(): Promise<void>;
}
```

Required MIDI messages:

```ts
type MidiMessage =
  | { type: 'noteOn'; channel: number; note: number; velocity: number }
  | { type: 'noteOff'; channel: number; note: number; velocity?: number }
  | { type: 'cc'; channel: number; controller: number; value: number }
  | { type: 'programChange'; channel: number; program: number }
  | { type: 'pitchBend'; channel: number; value: number }
  | { type: 'clock' }
  | { type: 'start' }
  | { type: 'stop' }
  | { type: 'continue' };
```

Use MIDI value ranges:

- Channel: internal `1..16`, convert to library-specific `0..15` only at adapter boundary.
- Notes: `0..127`.
- Velocity: `0..127`.
- CC value: `0..127`.
- Pitch bend: internal normalized `-1..1` or raw `0..16383`, but document and test the conversion.

### Panic

Implement panic at the MIDI abstraction level:

- Send note off for all tracked active notes.
- Send all notes off CC 123 on all active channels.
- Send all sound off CC 120 if configured.
- Reset sustain CC 64 to 0.
- Reset pitch bend to center.

Expose panic in the UI.

### Scheduling

The music engine must not emit ad-hoc note durations without tracking note-off events.

Implement a scheduler that:

- Uses a monotonic clock.
- Supports tempo/BPM.
- Supports beat and bar quantization.
- Tracks active notes.
- Cancels or resolves pending notes safely during config reloads.
- Provides deterministic test snapshots.

---

## Harmony Engine

The harmony engine owns the current harmonic context.

### Required features

- Key selection.
- Scale/mode selection.
- Chord progression.
- Roman numeral progression support.
- Chord tone selection.
- Scale quantization.
- Configurable passing-tone allowance.
- Tension value in `[0, 1]`.
- Common-tone or nearest-note transitions.
- Phrase-aware progression advancement.

### Example harmony config

```yaml
harmony:
  key: D
  mode: dorian
  progression:
    type: roman
    chords:
      - i7
      - IV7
      - VIImaj7
      - v7
    advance:
      mode: sensor_or_time
      sensor: windSpeed
      thresholds: [0.2, 0.45, 0.7]
      barsPerChord: 4
  quantize:
    enabled: true
    allowPassingTones: true
    passingToneProbability: 0.15
  voiceLeading:
    mode: commonTone
    maxLeapSemitones: 7
  tension:
    sources:
      - sensor: heel
        weight: 0.5
      - sensor: windGust
        weight: 0.3
      - sensor: shallowDepth
        weight: 0.2
```

### Required public API

```ts
export interface HarmonyEngine {
  getState(): HarmonyState;
  update(world: WorldState, arrangement: ArrangementState, now: number): HarmonyState;
  quantizeNote(candidate: MidiNoteCandidate, options?: QuantizeOptions): MidiNoteCandidate;
  getChordTones(octave?: number): number[];
  getScaleNotes(range: NoteRange): number[];
}
```

### Behaviour rules

- Notes generated by mappings must be quantized into the active scale unless explicitly disabled.
- Chord-tone notes should dominate strong beats.
- Passing tones may occur on weak beats only unless configured otherwise.
- Transitions between keys/chords must avoid abrupt jumps where possible.
- Never copy Loom melodies or proprietary motif shapes.

---

## Motif Engine

Motifs are short configurable musical patterns driven by state.

### Required motif types

- `single_note`
- `pulse`
- `arpeggio`
- `rising`
- `falling`
- `call_response`
- `warning`
- `drone`

### Motif config example

```yaml
motifs:
  windMelody:
    type: rising
    channel: 1
    range:
      low: D3
      high: A5
    rhythm:
      grid: 1/8
      densitySensor: windSpeed
      densityMin: 0.1
      densityMax: 0.85
    pitch:
      source: windAngle
      mode: scaleDegree
      contour: sensor_delta
    velocity:
      source: windSpeed
      min: 35
      max: 110

  shallowWarning:
    type: warning
    channel: 4
    trigger:
      sensor: depth
      below: 3.0
      hysteresis: 0.5
    rhythm:
      grid: 1/4
      repeats: 3
    pitch:
      degrees: [1, 5, 1]
      octave: 5
```

### Determinism

If random variation is used, it must be seeded and reproducible.

Config must allow:

```yaml
random:
  seed: singing-boat-default
```

---

## Arrangement Engine — Level 2 Requirements

The arrangement engine maps world state and musical state to arrangement state.

### Arrangement state

Implement:

```ts
export interface ArrangementState {
  scene: string;
  intensity: number;       // 0..1
  tension: number;         // 0..1
  density: number;         // 0..1
  phrasePosition: number;  // 0..1 within current phrase
  bar: number;
  beat: number;
  activeLayers: Record<string, LayerState>;
  activeMotifs: string[];
  transition?: ArrangementTransitionState;
}
```

### Required scenes

Provide defaults for:

- `calm`
- `steady_sailing`
- `fast_reach`
- `gusty`
- `shallow_water`
- `maneuver`
- `harbor`
- `connection_lost`

### Required layer types

- `drone`
- `pulse`
- `bass`
- `arpeggio`
- `melody`
- `texture`
- `event_motif`
- `warning`

### Scene selection

Implement rule-based scene selection.

Example:

```yaml
arrangement:
  level: 2
  phraseLengthBars: 8
  scenes:
    calm:
      when:
        all:
          - sensor: windSpeed
            below: 0.2
          - sensor: boatSpeed
            below: 0.15
      layers:
        drone: { enabled: true, gain: 0.45 }
        pulse: { enabled: false }
        melody: { enabled: true, density: 0.15 }

    steady_sailing:
      when:
        all:
          - sensor: boatSpeed
            above: 0.2
          - sensor: windSpeed
            between: [0.2, 0.65]
      layers:
        drone: { enabled: true, gain: 0.55 }
        pulse: { enabled: true, density: 0.35 }
        bass: { enabled: true, density: 0.25 }
        melody: { enabled: true, density: 0.35 }

    gusty:
      when:
        any:
          - sensor: windGust
            above: 0.7
          - sensor: heel
            absAbove: 0.65
      layers:
        pulse: { enabled: true, density: 0.75 }
        arpeggio: { enabled: true, density: 0.8 }
        event_motif: { enabled: true, motif: gustAccent }
```

### Scene transition rules

- Prefer changes on bar or phrase boundaries.
- Emergency/warning motifs may interrupt immediately.
- Use hysteresis to avoid flapping.
- Smooth CC values over configured transition duration.
- Keep common tones during harmonic changes.
- Do not kill notes abruptly unless panic/disconnect policy requires it.

### DAW relationship

The app may send MIDI to influence a DAW setup:

- Notes.
- CC values for instrument/effect parameters.
- Program changes if configured.
- Optional MIDI clock/start/stop.

The app must not implement auto-DJ behaviours:

- No playlist selection.
- No audio clip selection.
- No track recommendation.
- No DAW project analysis.
- No external media library scanning.

---

## Mapping Engine

The mapping engine converts normalized sensors and musical state into MIDI instructions.

### Required mapping targets

- MIDI note stream.
- MIDI CC.
- Pitch bend.
- Program change.
- Arrangement parameter.
- Harmony parameter.
- Motif trigger.

### Mapping example

```yaml
mappings:
  - id: wind-expression
    source: windSpeed
    target:
      type: cc
      channel: 1
      controller: 11
    transform:
      curve: easeInOut
      min: 20
      max: 110
    smoothing:
      rampMs: 500

  - id: heel-pitchbend
    source: heel
    target:
      type: pitchBend
      channel: 2
    transform:
      mode: bipolar
      min: -0.25
      max: 0.25
    smoothing:
      rampMs: 250

  - id: wind-angle-melody
    source: windAngle
    target:
      type: motifParameter
      motif: windMelody
      parameter: scaleDegree
    transform:
      mode: circular
      inputRange: [-3.14159, 3.14159]
      outputRange: [1, 7]
      quantize: integer

  - id: depth-warning
    source: depth
    target:
      type: motifTrigger
      motif: shallowWarning
    trigger:
      below: 3.0
      hysteresis: 0.5
```

### Transform functions

Implement:

- Linear.
- Inverted linear.
- Exponential.
- Log-like curve.
- Ease-in-out.
- Stepped.
- Integer quantization.
- Circular angle mapping.
- Bipolar mapping.
- Threshold with hysteresis.

---

## Configuration System

### Requirements

- Load default config on first run.
- Save user config in app data directory.
- Import/export YAML or JSON.
- Validate with Zod before applying.
- Support config versioning and migrations.
- Apply config live without restart.
- Roll back if apply fails.

### Complete default config example

Create `examples/configs/level2-arrangement.yaml`:

```yaml
version: 1

app:
  name: Singing Boat
  randomSeed: singing-boat-v1

signalk:
  enabled: true
  protocol: ws
  host: localhost
  port: 3000
  version: v1
  subscribe: self
  token: null
  reconnect:
    minDelayMs: 500
    maxDelayMs: 10000
    jitter: true
  stalePolicy:
    defaultStaleAfterMs: 5000
    onDisconnect: fade_then_silence
    fadeMs: 3000

midi:
  output:
    mode: selected_or_virtual
    preferredName: Singing Boat
    createVirtual: true
  panicOnStop: true
  sendClock: false
  channels:
    melody: 1
    drone: 2
    bass: 3
    warnings: 4
    control: 16

clock:
  bpm:
    base: 84
    min: 60
    max: 128
    source: boatSpeed
    amount: 0.35
  beatsPerBar: 4
  phraseLengthBars: 8
  swing: 0

sensors:
  windSpeed:
    path: environment.wind.speedApparent
    sourceUnits: m/s
    displayUnits: kn
    normalize:
      min: 0
      max: 20
      curve: easeInOut
    smoothing:
      type: ema
      alpha: 0.12
    staleAfterMs: 5000

  windAngle:
    path: environment.wind.angleApparent
    sourceUnits: rad
    displayUnits: deg
    normalize:
      min: -3.14159
      max: 3.14159
      mode: bipolarCircular
    smoothing:
      type: emaCircular
      alpha: 0.2
    staleAfterMs: 5000

  boatSpeed:
    path: navigation.speedThroughWater
    sourceUnits: m/s
    displayUnits: kn
    normalize:
      min: 0
      max: 5
      curve: linear
    smoothing:
      type: ema
      alpha: 0.15
    staleAfterMs: 5000

  depth:
    path: navigation.depth.belowTransducer
    sourceUnits: m
    displayUnits: m
    normalize:
      min: 1
      max: 30
      invert: true
      curve: easeInOut
    smoothing:
      type: ema
      alpha: 0.2
    staleAfterMs: 5000

  heel:
    path: navigation.attitude.roll
    sourceUnits: rad
    displayUnits: deg
    normalize:
      min: -0.7
      max: 0.7
      center: 0
      mode: bipolar
    smoothing:
      type: ema
      alpha: 0.2
    deadband: 0.02
    staleAfterMs: 5000

  windGust:
    derivedFrom: windSpeed
    mode: deltaAboveAverage
    windowMs: 10000
    normalize:
      min: 0
      max: 0.4

harmony:
  key: D
  mode: dorian
  progression:
    type: roman
    chords: [i7, IV7, VIImaj7, v7]
    advance:
      mode: sensor_or_time
      sensor: windSpeed
      thresholds: [0.2, 0.45, 0.7]
      barsPerChord: 4
  quantize:
    enabled: true
    allowPassingTones: true
    passingToneProbability: 0.15
  voiceLeading:
    mode: commonTone
    maxLeapSemitones: 7
  tension:
    sources:
      - sensor: heel
        weight: 0.5
      - sensor: windGust
        weight: 0.3
      - sensor: depth
        weight: 0.2

motifs:
  windMelody:
    type: rising
    channel: melody
    range:
      low: D3
      high: A5
    rhythm:
      grid: 1/8
      densitySensor: windSpeed
      densityMin: 0.1
      densityMax: 0.85
    pitch:
      source: windAngle
      mode: scaleDegree
      contour: sensor_delta
    velocity:
      source: windSpeed
      min: 35
      max: 110

  drone:
    type: drone
    channel: drone
    notes: chord_root_and_fifth
    octave: 2
    ccGain:
      controller: 11
      min: 30
      max: 90
      source: windSpeed

  bassPulse:
    type: pulse
    channel: bass
    rhythm:
      grid: 1/4
      densitySensor: boatSpeed
      densityMin: 0.15
      densityMax: 0.6
    pitch:
      mode: chordRoot
      octave: 2
    velocity:
      source: boatSpeed
      min: 30
      max: 100

  gustAccent:
    type: arpeggio
    channel: melody
    trigger:
      sensor: windGust
      above: 0.65
      cooldownMs: 3000
    rhythm:
      grid: 1/16
      steps: 6
    pitch:
      mode: chordTones
      contour: up_then_down
    velocity:
      fixed: 105

  shallowWarning:
    type: warning
    channel: warnings
    trigger:
      sensor: depth
      above: 0.8
      hysteresis: 0.1
    rhythm:
      grid: 1/4
      repeats: 3
    pitch:
      degrees: [1, 5, 1]
      octave: 5
    velocity:
      fixed: 115

arrangement:
  level: 2
  phraseLengthBars: 8
  transition:
    defaultDurationMs: 4000
    quantizeTo: bar
    mode: crossfade_layers_common_tone
  scenes:
    calm:
      when:
        all:
          - sensor: windSpeed
            below: 0.2
          - sensor: boatSpeed
            below: 0.15
      layers:
        drone: { enabled: true, gain: 0.45 }
        bassPulse: { enabled: false }
        windMelody: { enabled: true, density: 0.15 }

    steady_sailing:
      when:
        all:
          - sensor: boatSpeed
            above: 0.2
          - sensor: windSpeed
            between: [0.2, 0.65]
      layers:
        drone: { enabled: true, gain: 0.6 }
        bassPulse: { enabled: true, density: 0.35 }
        windMelody: { enabled: true, density: 0.4 }

    fast_reach:
      when:
        all:
          - sensor: boatSpeed
            above: 0.6
          - sensor: windSpeed
            above: 0.45
      layers:
        drone: { enabled: true, gain: 0.7 }
        bassPulse: { enabled: true, density: 0.6 }
        windMelody: { enabled: true, density: 0.7 }

    gusty:
      when:
        any:
          - sensor: windGust
            above: 0.65
          - sensor: heel
            absAbove: 0.65
      priority: 70
      layers:
        drone: { enabled: true, gain: 0.75 }
        bassPulse: { enabled: true, density: 0.8 }
        windMelody: { enabled: true, density: 0.85 }
        gustAccent: { enabled: true }

    shallow_water:
      when:
        any:
          - sensor: depth
            above: 0.8
      priority: 90
      interrupt: true
      layers:
        drone: { enabled: true, gain: 0.55 }
        bassPulse: { enabled: false }
        windMelody: { enabled: true, density: 0.25 }
        shallowWarning: { enabled: true }

mappings:
  - id: wind-expression
    source: windSpeed
    target:
      type: cc
      channel: melody
      controller: 11
    transform:
      curve: easeInOut
      min: 20
      max: 110
    smoothing:
      rampMs: 500

  - id: heel-pitchbend
    source: heel
    target:
      type: pitchBend
      channel: drone
    transform:
      mode: bipolar
      min: -0.15
      max: 0.15
    smoothing:
      rampMs: 250
```

---

## Renderer UI Requirements

Implement these screens or panels.

### Connection panel

Show:

- Signal K URL.
- Connected/disconnected/reconnecting state.
- Last message time.
- Subscription status.
- MIDI output state.
- Selected MIDI output port.

Controls:

- Connect/disconnect.
- Refresh MIDI ports.
- Select MIDI output.
- Create virtual output where supported.

### Sensor monitor

Show:

- Configured logical sensor name.
- Signal K path.
- Raw value.
- Converted value.
- Normalized value.
- Timestamp age.
- Stale/missing/valid state.

### Mapping editor

Minimum viable editor:

- List mappings.
- Enable/disable mapping.
- Edit YAML/JSON config text.
- Validate config.
- Apply config.
- Export config.

A full graphical mapping editor is optional for v1.

### Harmony panel

Show:

- Current key.
- Mode/scale.
- Current chord.
- Progression position.
- Tension value.
- Quantization status.

### Arrangement panel

Show:

- Current scene.
- Scene confidence or matched rule.
- Intensity.
- Density.
- Active layers.
- Active motifs.
- Transition status.

### MIDI monitor

Show recent generated MIDI messages:

- Timestamp.
- Message type.
- Channel.
- Note/CC/controller/value.
- Source mapping or motif ID.

Provide filters by channel and message type.

### Panic/reset

Always visible:

- Panic button.
- Stop all output.
- Reset pitch bend.
- Clear stuck notes.

---

## Smooth Hot-Reload Requirements

When applying a new config:

1. Parse new config.
2. Validate schema.
3. Run semantic validation.
4. Build next engine state in memory.
5. Diff current config vs next config.
6. Create transition plan.
7. Apply transition at configured quantization boundary.
8. Ramp CCs and arrangement gains.
9. Resolve active notes safely.
10. Preserve compatible harmonic state where possible.
11. Roll back on failure.

Semantic validation must catch:

- Unknown sensor references.
- Unknown channel aliases.
- Invalid MIDI channels.
- Invalid MIDI note names.
- Invalid CC/controller numbers.
- Invalid transform ranges.
- Invalid harmony configuration.
- Invalid scene rules.
- Motifs referencing missing sensors.

Transition behaviour:

- Do not abruptly kill sustained notes unless explicitly configured.
- Do not leave notes active after motif/layer removal.
- Fade or end removed layers cleanly.
- Ramp CC changes.
- Use common tones when changing chords/keys if possible.

---

## Simulator Mode

Provide simulator mode so development and demos work without a boat.

Simulator requirements:

- Generate plausible Signal K-like values.
- Support at least three profiles:
  - `calm_harbor`
  - `steady_sailing`
  - `gusty_reach`
  - `shallow_approach`
- Allow manual overrides from UI sliders.
- Allow replay of JSONL Signal K delta fixtures.

Simulator output should flow through the same world state, music, mapping, and MIDI paths as real Signal K data.

Do not create separate fake music logic for simulator mode.

---

## Error Handling

Required behaviours:

- Invalid config: reject and keep previous running config.
- Signal K disconnected: follow configured disconnect policy.
- MIDI port lost: stop scheduler, panic tracked notes, show UI error.
- MIDI send failure: mark output unhealthy and stop new notes.
- Renderer crash: main process should clean up MIDI output.
- Main process quit: send panic if configured.

All errors should be logged with enough context for debugging.

Do not log Signal K auth tokens.

---

## Logging

Implement structured logging.

Minimum log events:

- App start/stop.
- Config loaded/applied/rejected.
- Signal K connected/disconnected/reconnecting.
- MIDI port opened/closed/error.
- Scene changed.
- Harmony changed.
- Panic triggered.
- Scheduler overload or late event.

Support log levels:

- `debug`
- `info`
- `warn`
- `error`

---

## Testing Requirements

### Unit tests

Create tests for:

- Signal K delta parsing.
- World state update and staleness.
- Unit conversion.
- Normalization curves.
- Smoothing filters.
- Hysteresis thresholds.
- Circular angle handling.
- Harmony progression resolution.
- Note quantization.
- Voice-leading/common-tone transitions.
- Motif generation.
- Scene rule evaluation.
- Arrangement transitions.
- MIDI message encoding.
- Panic behaviour.
- Config validation.
- Config migration.

### Integration tests

Create integration tests for:

- Fixture Signal K delta stream → expected world state.
- World state → arrangement scene changes.
- World state → generated MIDI snapshot.
- Config hot reload with active notes.
- MIDI output mock receives note-off for every note-on.

### Determinism tests

Given:

- Same config.
- Same random seed.
- Same Signal K fixture.

The generated MIDI event snapshot must be stable.

### Manual test scenarios

Document manual tests for:

- macOS IAC/virtual MIDI routing into FL Studio or another DAW.
- Windows loopMIDI routing.
- Simulator mode.
- Real Signal K server connection.
- Panic button.
- Config hot reload.
- Disconnect/reconnect.

---

## Acceptance Criteria

The implementation is acceptable when all of the following are true.

### Core app

- The app starts as a desktop application.
- The app can run in simulator mode without Signal K.
- The app can connect to a Signal K WebSocket stream.
- The app parses delta updates for configured paths.
- The app shows live sensor values in the UI.
- The app lists MIDI output ports.
- The app sends MIDI to a selected port.
- Panic reliably silences all active notes.

### Mapping

- At least one Signal K value can control a MIDI CC.
- At least one Signal K value can control pitch selection.
- At least one Signal K value can trigger a motif.
- At least one Signal K value can influence tempo, density, or velocity.

### Harmony

- Generated notes can be quantized to a configured key/mode.
- Chord progression changes are audible in generated MIDI.
- Chord progression can advance by time and/or sensor thresholds.
- Harmony state is visible in the UI.

### Level 2 arrangement

- The app detects at least four scenes from world state or simulator state.
- The app enables/disables layers based on scene.
- The app changes density/intensity based on state.
- Scene transitions are quantized or smoothed.
- Warning/event motifs can interrupt normal arrangement when configured.
- Arrangement state is visible in the UI.

### Hot reload

- Config can be edited and applied without restarting the app.
- Invalid config is rejected without disrupting current playback.
- Valid config changes are applied smoothly.
- Removed layers do not leave stuck notes.

### Packaging

- Development start command works.
- Test command works.
- Production build command works.
- Packaged app can be launched on macOS.
- Windows packaging is configured, even if final signing/installer polish is deferred.

---

## Build Scripts

Create package scripts similar to:

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "tsc --noEmit && electron-vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "package": "electron-forge package",
    "make": "electron-forge make"
  }
}
```

Adapt the scripts if using a different Electron build tool.

---

## Implementation Plan

Implement in this order.

### Milestone 1 — Project bootstrap

- Create TypeScript Electron app.
- Add main/preload/renderer structure.
- Add strict TypeScript config.
- Add test runner.
- Add logging.
- Add basic IPC bridge.

Deliverable:

- App window opens.
- Renderer can request app status from main process.
- Tests run.

### Milestone 2 — Config system

- Add config schema.
- Add default config.
- Add load/save/import/export.
- Add validation.
- Add UI config viewer/editor.

Deliverable:

- User can edit config and see validation errors.

### Milestone 3 — Signal K and simulator

- Add Signal K WebSocket client.
- Add delta parser.
- Add reconnect logic.
- Add world state store.
- Add simulator profiles.

Deliverable:

- UI shows live values from either Signal K or simulator.

### Milestone 4 — MIDI output

- Add MIDI abstraction.
- Add native backend.
- Add mock backend.
- Add port selection.
- Add panic.
- Add MIDI monitor.

Deliverable:

- App can send test notes and CCs to a DAW.

### Milestone 5 — Mapping engine

- Add transforms.
- Add sensor → CC mapping.
- Add sensor → pitch mapping.
- Add sensor → pitch bend mapping.
- Add mapping tests.

Deliverable:

- Wind-speed-style simulator data can control MIDI continuously.

### Milestone 6 — Harmony engine

- Add Tonal.js wrapper.
- Add key/mode/scale quantization.
- Add chord progression.
- Add tension calculation.
- Add voice-leading transition support.

Deliverable:

- Generated notes remain in configured harmonic context.

### Milestone 7 — Motif engine

- Add motif types.
- Add rhythm grid.
- Add density control.
- Add event triggers.
- Add note tracking.

Deliverable:

- Simulator can generate a musically coherent stream of notes.

### Milestone 8 — Level 2 arrangement

- Add scene rules.
- Add layer state.
- Add arrangement intensity/density/tension.
- Add phrase-aware transitions.
- Add arrangement UI panel.

Deliverable:

- Simulator scenarios visibly and audibly change scenes/layers.

### Milestone 9 — Hot reload and transition safety

- Add config diff.
- Add transition planner.
- Add smooth CC ramps.
- Add safe note-off handling for removed layers.
- Add rollback on failure.

Deliverable:

- Config can be changed while MIDI is playing without stuck notes.

### Milestone 10 — Packaging and docs

- Add packaging config.
- Add macOS MIDI routing doc.
- Add Windows MIDI routing doc.
- Add config reference.
- Add README quickstart.

Deliverable:

- Packaged app can be launched and connected to a DAW.

---

## Documentation Requirements

Create or update:

### `README.md`

Include:

- What Singing Boat is.
- What v1 does and does not do.
- Quickstart with simulator.
- Quickstart with Signal K.
- Quickstart with DAW MIDI input.
- Build/test/package commands.

### `docs/architecture.md`

Include:

- Main process architecture.
- Renderer architecture.
- Music engine flow.
- Config reload flow.
- MIDI scheduling flow.

### `docs/config-reference.md`

Include:

- Full schema explanation.
- Sensor config.
- Mapping config.
- Harmony config.
- Motif config.
- Arrangement config.

### `docs/midi-routing-macos.md`

Include:

- IAC Driver setup.
- App virtual port if supported.
- DAW MIDI input setup.
- Panic troubleshooting.

### `docs/midi-routing-windows.md`

Include:

- loopMIDI or equivalent virtual port setup.
- DAW MIDI input setup.
- Troubleshooting missing ports.

---

## Coding Standards

- Use TypeScript strict mode.
- Prefer pure functions in music logic.
- Keep side effects at boundaries.
- Keep MIDI library calls inside MIDI adapter only.
- Keep Electron IPC typed.
- Do not expose Node APIs directly to renderer.
- Avoid blocking the main process.
- Avoid unbounded timers.
- Avoid global mutable state except controlled singleton services in main process.
- Avoid magic numbers; put musical defaults in config/defaults.
- Add tests for bug fixes.

---

## Security Requirements

- Do not expose Signal K tokens to renderer unless necessary for display, and never log them.
- Use Electron context isolation.
- Disable renderer Node integration.
- Use a preload script with an explicit API surface.
- Validate all renderer IPC inputs.
- Treat imported config files as untrusted input.

---

## Performance Requirements

- The MIDI scheduler should remain stable under normal 1–20 Hz Signal K update rates.
- Do not regenerate expensive musical structures on every sensor update if only one normalized value changed.
- Use throttling/debouncing for UI updates.
- Keep musical timing independent from renderer frame rate.
- Detect scheduler lateness and log warnings.

---

## Design Constraints for Future Compatibility

Prepare for future versions without implementing them in v1.

Future features may include:

- OSC output.
- Signal K plugin distribution.
- Agent/LLM composer mode.
- Auto-DJ/playlist steering.
- Audio engine.
- More DAW-specific control surfaces.
- Recorded voyage-to-MIDI export.

Do not design v1 in a way that blocks these later features, but do not implement them now.

---

## Final Done Checklist

Before calling the implementation complete, verify:

- [ ] `npm install` succeeds.
- [ ] `npm run typecheck` succeeds.
- [ ] `npm run test` succeeds.
- [ ] `npm run build` succeeds.
- [ ] `npm run package` or equivalent succeeds.
- [ ] Simulator mode works.
- [ ] Signal K WebSocket mode works against a real or mocked server.
- [ ] MIDI port selection works.
- [ ] MIDI output reaches a DAW or mock receiver.
- [ ] Panic silences active notes.
- [ ] Harmony quantization works.
- [ ] Chord progression works.
- [ ] Level 2 scenes and layers work.
- [ ] Config hot reload works.
- [ ] Invalid config rollback works.
- [ ] No stuck notes after config reload, disconnect, or app quit.
- [ ] README quickstart is accurate.
- [ ] macOS MIDI routing doc exists.
- [ ] Windows MIDI routing doc exists.

