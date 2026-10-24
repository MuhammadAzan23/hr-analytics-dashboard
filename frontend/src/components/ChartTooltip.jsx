// Shared Recharts tooltip. `rows` maps a payload entry to [label, value].
export default function ChartTooltip({ active, payload, label, title, rows }) {
  if (!active || !payload?.length) return null;
  const items = rows ? rows(payload) : payload.map((p) => ({ color: p.color, name: p.name, value: p.value }));
  return (
    <div className="tooltip">
      <div className="tooltip-title">{title ? title(payload, label) : label}</div>
      {items.map((it) => (
        <div key={it.name} className="tooltip-row">
          {it.color && <span className="swatch" style={{ background: it.color }} />}
          <span className="tooltip-name">{it.name}</span>
          <span className="tooltip-value">{it.value}</span>
        </div>
      ))}
    </div>
  );
}
