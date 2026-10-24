import { fmtMoney, fmtMoneyShort, fmtNumber, fmtPct } from "../utils/format.js";

export default function KpiCards({ summary, loading }) {
  const s = summary || {};
  const cards = [
    { label: "Total employees", value: fmtNumber(s.total_employees), sub: `${fmtNumber(s.active_employees)} active · ${fmtNumber(s.terminated_employees)} terminated` },
    { label: "Attrition rate", value: fmtPct(s.attrition_rate), sub: "Terminated / total" },
    { label: "Average salary", value: fmtMoney(s.avg_salary), sub: "All employees in view" },
    { label: "Annual payroll", value: fmtMoneyShort(s.total_payroll), sub: "Active employees' salaries" },
    { label: "Avg absences", value: fmtNumber(s.avg_absences, 1), sub: "Days per employee" },
    { label: "Engagement", value: s.avg_engagement != null ? `${fmtNumber(s.avg_engagement, 2)} / 5` : "–", sub: `Satisfaction ${s.avg_satisfaction != null ? fmtNumber(s.avg_satisfaction, 2) : "–"} / 5` },
  ];
  return (
    <section className="kpis" aria-label="Key metrics">
      {cards.map((c) => (
        <div key={c.label} className="card kpi">
          <span className="kpi-label">{c.label}</span>
          {loading ? <span className="skeleton kpi-skel" /> : <span className="kpi-value">{c.value}</span>}
          <span className="kpi-sub">{loading ? " " : c.sub}</span>
        </div>
      ))}
    </section>
  );
}
