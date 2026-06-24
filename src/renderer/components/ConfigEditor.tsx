type Props = {
  onExport: () => void;
};

export function ConfigEditor({ onExport }: Props): JSX.Element {
  return (
    <section className="panel">
      <h2>Config Tools</h2>
      <p className="muted">Export current in-memory config snapshot.</p>
      <button onClick={onExport}>Export Config</button>
    </section>
  );
}
