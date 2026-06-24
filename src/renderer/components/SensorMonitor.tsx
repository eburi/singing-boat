import type { SensorValue } from '../../main/state/SensorValue';

type Props = {
  sensors: Record<string, SensorValue>;
};

export function SensorMonitor({ sensors }: Props): JSX.Element {
  return (
    <section className="panel">
      <h2>Sensors</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Path</th>
            <th>Raw</th>
            <th>Converted</th>
            <th>Normalized</th>
            <th>Status</th>
            <th>Age</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(sensors).map(([name, value]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{value.path ?? '-'}</td>
              <td>{value.rawValue?.toFixed(3) ?? '-'}</td>
              <td>{value.convertedValue?.toFixed(3) ?? '-'}</td>
              <td>{value.normalizedValue.toFixed(3)}</td>
              <td>{value.status}</td>
              <td>{value.timestamp ? `${Math.round((Date.now() - value.timestamp) / 1000)}s` : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
