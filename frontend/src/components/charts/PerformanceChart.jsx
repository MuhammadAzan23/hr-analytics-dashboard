import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "../ChartTooltip.jsx";
import { fmtMoney, fmtNumber, fmtPct } from "../../utils/format.js";

export default function PerformanceChart({ data = [], chart }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 20, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke={chart.grid} />
        <XAxis dataKey="score" tick={{ fill: chart.text, fontSize: 12 }} tickLine={false} axisLine={{ stroke: chart.axis }} interval={0} />
        <YAxis allowDecimals={false} tick={{ fill: chart.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ fill: chart.grid, opacity: 0.5 }}
          content={
            <ChartTooltip
              rows={(p) => {
                const r = p[0].payload;
                return [
                  { color: chart.series[0], name: "Employees", value: fmtNumber(r.count) },
                  { name: "Share", value: fmtPct(r.pct) },
                  { name: "Avg salary", value: fmtMoney(r.avg_salary) },
                ];
              }}
            />
          }
        />
        <Bar dataKey="count" name="Employees" fill={chart.series[0]} radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={false}>
          <LabelList dataKey="pct" position="top" formatter={(v) => fmtPct(v)} fill={chart.text} fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
