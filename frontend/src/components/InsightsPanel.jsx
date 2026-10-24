import { EmptyState, Loader } from "./States.jsx";

export default function InsightsPanel({ insights, loading }) {
  return (
    <section className="card section" aria-labelledby="insights-title">
      <div className="section-head">
        <h2 id="insights-title">Insights</h2>
        <p className="muted">Computed live from the filtered data</p>
      </div>
      {loading ? (
        <Loader />
      ) : !insights?.length ? (
        <EmptyState text="Not enough data to compute insights for this selection." />
      ) : (
        <ul className="insights">
          {insights.map((ins, i) => (
            <li key={i}>
              <span className="tag">{ins.category}</span>
              <p>{ins.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
