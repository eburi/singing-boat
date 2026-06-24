type Props = {
  configText: string;
  onConfigTextChange: (next: string) => void;
  onValidate: () => Promise<void>;
  onApply: () => Promise<void>;
  validationMessage: string;
};

export function MappingEditor({ configText, onConfigTextChange, onValidate, onApply, validationMessage }: Props): JSX.Element {
  return (
    <section className="panel">
      <h2>Config and Mappings</h2>
      <p className="muted">Edit YAML, validate, then apply live.</p>
      <textarea className="editor" value={configText} onChange={(e) => onConfigTextChange(e.target.value)} spellCheck={false} />
      <div className="row">
        <button onClick={() => void onValidate()}>Validate Config</button>
        <button onClick={() => void onApply()}>Apply Config</button>
      </div>
      <div className="validation">{validationMessage}</div>
    </section>
  );
}
