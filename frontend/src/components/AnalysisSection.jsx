import { Loader } from "./States.jsx";

export default function AnalysisSection({ analysis, loading }) {
  return (
    <section className="card section" aria-labelledby="analysis-title">
      <div className="section-head">
        <h2 id="analysis-title">Analysis</h2>
        <p className="muted">What the charts show, key findings and recommendations. All figures come from the current selection.</p>
      </div>
      {loading || !analysis ? (
        <Loader />
      ) : (
        <div className="analysis">
          <div>
            <h3>What each chart shows</h3>
            <dl className="notes">
              {analysis.chart_notes.map((n) => (
                <div key={n.chart}>
                  <dt>{n.chart}</dt>
                  <dd>{n.text}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3>Key findings</h3>
            <ol className="findings">
              {analysis.findings.map((f, i) => <li key={i}>{f}</li>)}
            </ol>
            <h3>Recommendations for HR</h3>
            {analysis.recommendations.length ? (
              <ol className="findings recs">
                {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ol>
            ) : (
              <p className="muted">Select a broader set of employees to generate recommendations.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
