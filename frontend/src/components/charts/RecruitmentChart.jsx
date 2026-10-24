import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "../ChartTooltip.jsx";
import { fmtNumber, fmtPct, truncate } from "../../utils/format.js";

export default function RecruitmentChart({ data = [], chart }) {
  const height = Math.max(180, data.length * 32 + 70);
  return (
    <>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 72, bottom: 4, left: 4 }} barCategoryGap={6}>
          <CartesianGrid horizontal={false} stroke={chart.grid} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: chart.muted, fontSize: 11 }} tickLine={false}
            axisLine={{ stroke: chart.axis }} />
          <YAxis type="category" dataKey="source" width={128} interval={0} tickLine={false}
            axisLine={{ stroke: chart.axis }} tick={{ fill: chart.text, fontSize: 12 }} tickFormatter={(v) => truncate(v, 19)} />
          <Tooltip
            cursor={{ fill: chart.grid, opacity: 0.5 }}
            content={
              <ChartTooltip
                rows={(p) => {
                  const r = p[0].payload;
                  return [
                    { color: chart.series[0], name: "Active", value: fmtNumber(r.active) },
                    { color: chart.series[1], name: "Terminated", value: fmtNumber(r.terminated) },
                    { name: "Retention", value: fmtPct(r.retention_rate) },
                  ];
                }}
              />
            }
          />
          <Legend wrapperStyle={{ fontSize: 12, color: chart.text }} iconType="square" />
          <Bar dataKey="active" name="Active" stackId="r" fill={chart.series[0]} stroke={chart.surface} strokeWidth={1}
            maxBarSize={22} isAnimationActive={false} />
          <Bar dataKey="terminated" name="Terminated" stackId="r" fill={chart.series[1]} stroke={chart.surface} strokeWidth={1}
            radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
            <LabelList dataKey="retention_rate" position="right" formatter={(v) => `${fmtPct(v, 0)} kept`}
              fill={chart.text} fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="chart-foot">Label = retention rate (share of hires from that source still employed).</p>
    </>
  );
}
