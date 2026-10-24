import HBar from "./HBar.jsx";
import { fmtMoney, fmtNumber, fmtPct } from "../../utils/format.js";

const TOP = 12;

export default function PositionHeadcountChart({ data = [], chart }) {
  const rows = data.slice(0, TOP);
  return (
    <>
      <HBar rows={rows} labelKey="position" valueKey="headcount" valueName="Employees" chart={chart}
        color={chart.series[0]} format={(v) => fmtNumber(v)}
        extraRows={(r) => [
          { name: "Active", value: fmtNumber(r.active) },
          { name: "Attrition", value: fmtPct(r.attrition_rate) },
          { name: "Avg salary", value: fmtMoney(r.avg_salary) },
        ]} />
      {data.length > TOP && <p className="chart-foot">Top {TOP} of {data.length} roles by headcount.</p>}
    </>
  );
}
