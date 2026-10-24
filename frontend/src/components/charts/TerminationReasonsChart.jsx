import HBar from "./HBar.jsx";
import { fmtNumber, fmtPct } from "../../utils/format.js";

const TOP = 10;

export default function TerminationReasonsChart({ data, chart }) {
  const reasons = data?.reasons || [];
  const rows = reasons.slice(0, TOP);
  return (
    <>
      <HBar rows={rows} labelKey="reason" valueKey="count" valueName="Exits" chart={chart}
        color={chart.series[1]} format={(v) => fmtNumber(v)}
        extraRows={(r) => [{ name: "Share of exits", value: fmtPct(r.pct) }]} />
      <p className="chart-foot">
        {data.by_type.map((t) => `${t.type}: ${fmtNumber(t.count)}`).join(" · ")}
        {reasons.length > TOP ? ` · top ${TOP} of ${reasons.length} reasons` : ""}
      </p>
    </>
  );
}
