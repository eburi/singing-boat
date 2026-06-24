# Config Reference

Configuration is YAML or JSON with `version: 1`.

## Top-level keys

- `app` — metadata and deterministic random seed.
- `signalk` — WebSocket connection, reconnect, stale handling.
- `midi` — output routing, panic behavior, channel aliases.
- `clock` — BPM behavior and phrase timing.
- `sensors` — logical sensor definitions.
- `harmony` — key/mode/progression/quantization/tension.
- `motifs` — motif definitions and triggers.
- `arrangement` — Level 2 scenes/layers/transitions.
- `mappings` — sensor-to-MIDI/motif/harmony mappings.

## Sensors

Each sensor can define:

- `path` (Signal K source path) or `derivedFrom` + `mode`.
- `sourceUnits` / `displayUnits`.
- `normalize` with `min`, `max`, optional `curve`, `invert`, `mode`.
- `smoothing` (`ema` / `emaCircular`) and `alpha`.
- `deadband` and `staleAfterMs`.

## Mappings

Supported targets in v1 implementation:

- `cc`
- `pitchBend`
- `programChange`
- `motifTrigger`
- `motifParameter`

Common fields:

- `id`, `source`, `target`
- `transform` ranges/curve/mode
- `trigger` for threshold mappings
- `smoothing` ramp metadata

## Harmony

- `key` and `mode` define active scale.
- `progression` supports roman chord list and advancing by time/sensor.
- `quantize` controls in-scale enforcement and passing tones.
- `voiceLeading` controls transition policy.
- `tension.sources` is weighted sensor blend.

## Motifs

Available motif types include:

- `single_note`
- `pulse`
- `arpeggio`
- `rising`
- `falling`
- `call_response`
- `warning`
- `drone`

Motifs define channel, rhythm, pitch, velocity and optional triggers.

## Arrangement

- `level` should be `2` for v1 target.
- `phraseLengthBars` controls phrase-aware state.
- `transition` controls quantization and smoothing mode.
- `scenes` are rule-based; each scene includes:
  - `when` conditions (`all`/`any` with thresholds),
  - optional `priority` and `interrupt`,
  - `layers` toggles and parameters.

See full example: `examples/configs/level2-arrangement.yaml`.
