import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartTooltip from "../ChartTooltip.jsx";
import { fmtMoney, fmtNumber, fmtPct } from "../../utils/format.js";

const MAX_SLICES = 7; // the rest fold into "Other"

export default function DepartmentDonut({ data = [], allDepartments = [], chart }) {
  const total = data.reduce((s, d) => s + d.headcount, 0);
  let rows = data.map((d) => ({ ...d }));
  if (rows.length > MAX_SLICES + 1) {
    const rest = rows.slice(MAX_SLICES);
    rows = [...rows.slice(0, MAX_SLICES), {
      department: "Other", headcount: rest.reduce((s, d) => s + d.headcount, 0), avg_salary: null, attrition_rate: null,
    }];
  }
  // Color follows the department (its slot in the full department list), so filtering never repaints a slice
  const names = allDepartments.length ? allDepartments : [...rows.map((r) => r.department)].sort();
  const colorOf = (name) => (name === "Other" ? chart.muted : chart.series[names.indexOf(name) % chart.series.length]);

  return (
    <div className="donut-wrap">
      <div className="donut">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={rows} dataKey="headcount" nameKey="department" innerRadius="58%" outerRadius="92%"
              paddingAngle={rows.length > 1 ? 1.5 : 0} stroke={chart.surface} strokeWidth={2} isAnimationActive={false}>
              {rows.map((r) => <Cell key={r.department} fill={colorOf(r.department)} />)}
            </Pie>
            <Tooltip content={
              <ChartTooltip
                title={(p) => p[0].payload.department}
                rows={(p) => {
                  const r = p[0].payload;
                  return [
                    { color: colorOf(r.department), name: "Employees", value: `${fmtNumber(r.headcount)} (${fmtPct((r.headcount / total) * 100)})` },
                    ...(r.avg_salary != null ? [{ name: "Avg salary", value: fmtMoney(r.avg_salary) }] : []),
                    ...(r.attrition_rate != null ? [{ name: "Attrition", value: fmtPct(r.attrition_rate) }] : []),
                  ];
                }}
              />
            } />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center">
          <strong>{fmtNumber(total)}</strong>
          <span>employees</span>
        </div>
      </div>
      <ul className="legend">
        {rows.map((r) => (
          <li key={r.department}>
            <span className="swatch" style={{ background: colorOf(r.department) }} />
            <span className="legend-name">{r.department}</span>
            <span className="legend-value">{fmtNumber(r.headcount)} · {fmtPct((r.headcount / total) * 100)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
