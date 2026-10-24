import HBar from "./HBar.jsx";
import { fmtMoney, fmtMoneyShort, fmtNumber } from "../../utils/format.js";

const TOP = 12;

export default function SalaryByPositionChart({ data = [], chart }) {
  const sorted = [...data].filter((d) => d.avg_salary != null).sort((a, b) => b.avg_salary - a.avg_salary);
  const rows = sorted.slice(0, TOP);
  return (
    <>
      <HBar rows={rows} labelKey="position" valueKey="avg_salary" valueName="Avg salary" chart={chart}
        color={chart.series[0]} format={fmtMoneyShort} tickFormat={fmtMoneyShort}
        extraRows={(r) => [
          { name: "Exact", value: fmtMoney(r.avg_salary) },
          { name: "Employees", value: fmtNumber(r.headcount) },
        ]} />
      {sorted.length > TOP && <p className="chart-foot">Top {TOP} of {sorted.length} roles by average salary.</p>}
    </>
  );
}
