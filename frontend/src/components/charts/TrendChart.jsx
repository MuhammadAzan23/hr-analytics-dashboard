import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "../ChartTooltip.jsx";
import { fmtNumber } from "../../utils/format.js";

export default function TrendChart({ data = [], chart }) {
  const monthly = data.length > 30;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke={chart.grid} />
        <XAxis dataKey="period" tick={{ fill: chart.muted, fontSize: 11 }} tickLine={false}
          axisLine={{ stroke: chart.axis }} minTickGap={monthly ? 24 : 8} />
        <YAxis allowDecimals={false} tick={{ fill: chart.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          cursor={{ stroke: chart.axis, strokeWidth: 1 }}
          content={
            <ChartTooltip
              rows={(p) => [
                ...p.map((x) => ({ color: x.color, name: x.name, value: fmtNumber(x.value) })),
                { name: "Net change", value: (p[0].payload.net > 0 ? "+" : "") + fmtNumber(p[0].payload.net) },
              ]}
            />
          }
        />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: chart.text }} />
        <Line type="monotone" dataKey="hires" name="Hires" stroke={chart.series[0]} strokeWidth={2}
          dot={monthly ? false : { r: 3, strokeWidth: 2, fill: chart.surface }} activeDot={{ r: 5 }} isAnimationActive={false} />
        <Line type="monotone" dataKey="terminations" name="Terminations" stroke={chart.series[1]} strokeWidth={2}
          dot={monthly ? false : { r: 3, strokeWidth: 2, fill: chart.surface }} activeDot={{ r: 5 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
