import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "../ChartTooltip.jsx";
import { fmtNumber, fmtPct, truncate } from "../../utils/format.js";

// 100% stacked bars: share of each rating inside every department
export default function PerformanceByDeptChart({ data, chart }) {
  const scores = data?.scores || [];
  const rows = (data?.by_department || []).map((d) => {
    const row = { department: d.department, total: d.total };
    scores.forEach((s) => {
      row[s] = d.total ? (d.counts[s] / d.total) * 100 : 0;
      row[`${s}__n`] = d.counts[s];
    });
    return row;
  });
  const height = Math.max(180, rows.length * 34 + 70);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke={chart.grid} />
        <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`}
          tick={{ fill: chart.muted, fontSize: 11 }} tickLine={false} axisLine={{ stroke: chart.axis }} />
        <YAxis type="category" dataKey="department" width={128} interval={0} tickLine={false}
          axisLine={{ stroke: chart.axis }} tick={{ fill: chart.text, fontSize: 12 }} tickFormatter={(v) => truncate(v, 19)} />
        <Tooltip
          cursor={{ fill: chart.grid, opacity: 0.5 }}
          content={
            <ChartTooltip
              rows={(p) =>
                p.map((x) => ({
                  color: x.color,
                  name: x.name,
                  value: `${fmtNumber(x.payload[`${x.dataKey}__n`])} (${fmtPct(x.value)})`,
                }))
              }
            />
          }
        />
        <Legend wrapperStyle={{ fontSize: 12, color: chart.text }} iconType="square" />
        {scores.map((s, i) => (
          <Bar key={s} dataKey={s} name={s} stackId="perf" fill={chart.series[i % chart.series.length]}
            stroke={chart.surface} strokeWidth={1} maxBarSize={22} isAnimationActive={false} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
