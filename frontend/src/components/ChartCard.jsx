import { EmptyState, Loader } from "./States.jsx";

export default function ChartCard({ title, subtitle, loading, isEmpty, emptyText, actions, wide, children }) {
  return (
    <article className={`card chart-card${wide ? " wide" : ""}`}>
      <div className="chart-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="muted">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="chart-body">
        {loading ? <Loader /> : isEmpty ? <EmptyState text={emptyText} /> : children}
      </div>
    </article>
  );
}
