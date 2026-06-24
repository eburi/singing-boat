# macOS MIDI Routing

## IAC Driver setup

1. Open `Audio MIDI Setup`.
2. Open `MIDI Studio`.
3. Double-click `IAC Driver`.
4. Enable `Device is online` and create a port (for example `SingingBoat-IAC`).

## App virtual output

- If supported by backend, click `Create Virtual` in app Connection panel.
- Otherwise use IAC port and select it from MIDI outputs list.

## DAW setup

1. Open your DAW MIDI preferences.
2. Enable input from selected IAC or virtual port.
3. Arm a MIDI track and route to synth/instrument.
4. Confirm note and CC activity from Singing Boat monitor.

## Panic troubleshooting

- If notes stick, click `Panic / Reset`.
- Confirm DAW listens to same port/channel used by app mappings.
- Check that no MIDI filtering plugin blocks CC 123/120/64.
- Re-open output port in app and retry.
