import type { ArrangementState } from '../../main/music/types';

type Props = {
  arrangement: ArrangementState;
};

export function ArrangementPanel({ arrangement }: Props): JSX.Element {
  return (
    <section className="panel">
      <h2>Arrangement</h2>
      <ul className="kv">
        <li>
          <span>Scene</span>
          <strong>{arrangement.scene}</strong>
        </li>
        <li>
          <span>Intensity</span>
          <strong>{arrangement.intensity.toFixed(2)}</strong>
        </li>
        <li>
          <span>Density</span>
          <strong>{arrangement.density.toFixed(2)}</strong>
        </li>
        <li>
          <span>Tension</span>
          <strong>{arrangement.tension.toFixed(2)}</strong>
        </li>
        <li>
          <span>Bar / Beat</span>
          <strong>
            {arrangement.bar} / {arrangement.beat}
          </strong>
        </li>
      </ul>
      <h3>Active Layers</h3>
      <ul className="list compact">
        {Object.entries(arrangement.activeLayers).map(([name, state]) => (
          <li key={name}>
            {name}: {state.enabled ? 'on' : 'off'}
          </li>
        ))}
      </ul>
      <h3>Active Motifs</h3>
      <ul className="list compact">
        {arrangement.activeMotifs.length === 0 ? <li>None</li> : arrangement.activeMotifs.map((m) => <li key={m}>{m}</li>)}
      </ul>
      {arrangement.transition ? <div>Transition: {arrangement.transition.fromScene} → {arrangement.transition.toScene}</div> : null}
    </section>
  );
}
