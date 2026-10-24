const FIELDS = [
  { key: "department", label: "Department", optionsKey: "departments", all: "All departments" },
  { key: "position", label: "Position", optionsKey: "positions", all: "All positions" },
  { key: "status", label: "Status", optionsKey: "statuses", all: "All statuses" },
];

export default function FilterBar({ options, filters, onChange, onReset, activeCount, loading }) {
  return (
    <section className="filter-bar card" aria-label="Filters">
      {FIELDS.map((f) => (
        <label key={f.key} className="field">
          <span>{f.label}</span>
          <select value={filters[f.key]} onChange={(e) => onChange({ ...filters, [f.key]: e.target.value })}>
            <option value="">{f.all}</option>
            {(options[f.optionsKey] || []).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
      ))}
      <div className="filter-actions">
        {loading && <span className="spinner small" aria-label="Updating" />}
        <button className="btn ghost" onClick={onReset} disabled={!activeCount}>
          Reset{activeCount ? ` (${activeCount})` : ""}
        </button>
      </div>
    </section>
  );
}
