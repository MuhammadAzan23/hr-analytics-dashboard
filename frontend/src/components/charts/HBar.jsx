import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "../ChartTooltip.jsx";
import { truncate } from "../../utils/format.js";

// Horizontal single-series bar chart; height grows with the number of rows.
export default function HBar({ rows, labelKey, valueKey, chart, color, format, tickFormat, valueName, extraRows }) {
  const height = Math.max(160, rows.length * 30 + 36);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 52, bottom: 4, left: 4 }} barCategoryGap={6}>
        <CartesianGrid horizontal={false} stroke={chart.grid} />
        <XAxis type="number" tick={{ fill: chart.muted, fontSize: 11 }} axisLine={{ stroke: chart.axis }}
          tickLine={false} tickFormatter={tickFormat || format} />
        <YAxis type="category" dataKey={labelKey} width={128} interval={0} tickLine={false}
          axisLine={{ stroke: chart.axis }} tick={{ fill: chart.text, fontSize: 12 }}
          tickFormatter={(v) => truncate(v, 19)} />
        <Tooltip
          cursor={{ fill: chart.grid, opacity: 0.5 }}
          content={
            <ChartTooltip
              rows={(p) => [
                { color, name: valueName, value: format(p[0].value) },
                ...(extraRows ? extraRows(p[0].payload) : []),
              ]}
            />
          }
        />
        <Bar dataKey={valueKey} name={valueName} fill={color} radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
          <LabelList dataKey={valueKey} position="right" formatter={format} fill={chart.text} fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
