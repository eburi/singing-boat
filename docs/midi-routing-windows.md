# Windows MIDI Routing

## loopMIDI setup

1. Install loopMIDI (or equivalent virtual MIDI cable).
2. Create a virtual port (for example `SingingBoatLoop`).
3. Start Singing Boat and click `Refresh MIDI Ports`.
4. Select created loopMIDI port in Connection panel.

## DAW setup

1. Open DAW MIDI settings.
2. Enable loopMIDI input port.
3. Arm a MIDI track and choose target instrument.
4. Verify events appear in DAW input meter and in app monitor.

## Troubleshooting missing ports

- Ensure loopMIDI app is running before launching Singing Boat.
- Click refresh in Singing Boat after creating/removing ports.
- Restart DAW MIDI engine if port appears busy.
- Check channel routing (app defaults in config `midi.channels`).
