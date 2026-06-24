import type { HarmonyState } from '../../main/music/types';

type Props = {
  harmony: HarmonyState;
};

export function HarmonyPanel({ harmony }: Props): JSX.Element {
  return (
    <section className="panel">
      <h2>Harmony</h2>
      <ul className="kv">
        <li>
          <span>Key</span>
          <strong>{harmony.key}</strong>
        </li>
        <li>
          <span>Mode</span>
          <strong>{harmony.mode}</strong>
        </li>
        <li>
          <span>Chord</span>
          <strong>{harmony.chord}</strong>
        </li>
        <li>
          <span>Progression Index</span>
          <strong>{harmony.progressionIndex}</strong>
        </li>
        <li>
          <span>Tension</span>
          <strong>{harmony.tension.toFixed(2)}</strong>
        </li>
        <li>
          <span>Quantize</span>
          <strong>{harmony.quantizeEnabled ? 'on' : 'off'}</strong>
        </li>
      </ul>
    </section>
  );
}
