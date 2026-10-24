import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, isApiConfigured } from "../api/client.js";
import Header from "../components/Header.jsx";
import FilterBar from "../components/FilterBar.jsx";
import KpiCards from "../components/KpiCards.jsx";
import ChartCard from "../components/ChartCard.jsx";
import InsightsPanel from "../components/InsightsPanel.jsx";
import AnalysisSection from "../components/AnalysisSection.jsx";
import EmployeeTable from "../components/EmployeeTable.jsx";
import { ErrorState } from "../components/States.jsx";
import PositionHeadcountChart from "../components/charts/PositionHeadcountChart.jsx";
import DepartmentDonut from "../components/charts/DepartmentDonut.jsx";
import SalaryByPositionChart from "../components/charts/SalaryByPositionChart.jsx";
import TrendChart from "../components/charts/TrendChart.jsx";
import PerformanceChart from "../components/charts/PerformanceChart.jsx";
import PerformanceByDeptChart from "../components/charts/PerformanceByDeptChart.jsx";
import TerminationReasonsChart from "../components/charts/TerminationReasonsChart.jsx";
import RecruitmentChart from "../components/charts/RecruitmentChart.jsx";

const EMPTY_FILTERS = { department: "", position: "", status: "" };

export default function Dashboard({ theme, chart, onToggleTheme }) {
  const [options, setOptions] = useState({ departments: [], positions: [], statuses: [] });
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [granularity, setGranularity] = useState("year");
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const firstLoad = useRef(true);

  // Filter options (loaded once)
  useEffect(() => {
    if (!isApiConfigured) return;
    const ctrl = new AbortController();
    api.filters({ signal: ctrl.signal }).then(setOptions).catch(() => {});
    return () => ctrl.abort();
  }, [reloadKey]);

  // All KPIs + charts refresh together whenever filters change
  useEffect(() => {
    const ctrl = new AbortController();
    const opts = { signal: ctrl.signal };
    setLoading(true);
    setError(null);
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    Promise.all([
      api.summary(filters, opts),
      api.positions(filters, opts),
      api.departments(filters, opts),
      api.performance(filters, opts),
      api.recruitment(filters, opts),
      api.terminations(filters, opts),
      api.insights(filters, opts),
      api.analysis(filters, opts),
    ])
      .then(([summary, positions, departments, performance, recruitment, terminations, insights, analysis]) => {
        setData({ summary, positions, departments, performance, recruitment, terminations, insights, analysis });
        firstLoad.current = false;
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        clearTimeout(slowTimer);
        if (!ctrl.signal.aborted) {
          setLoading(false);
          setSlow(false);
        }
      });
    return () => {
      clearTimeout(slowTimer);
      ctrl.abort();
    };
  }, [filters, reloadKey]);

  // Trend has its own granularity toggle
  useEffect(() => {
    const ctrl = new AbortController();
    api
      .trend({ ...filters, granularity }, { signal: ctrl.signal })
      .then(setTrend)
      .catch((err) => {
        if (err.name !== "AbortError") setTrend({ granularity, points: [] });
      });
    return () => ctrl.abort();
  }, [filters, granularity, reloadKey]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);
  const activeFilterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);
  const empty = data && data.summary.total_employees === 0;

  return (
    <div className="app">
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main className="container">
        <FilterBar
          options={options}
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
          activeCount={activeFilterCount}
          loading={loading}
        />

        {slow && loading && (
          <div className="notice" role="status">
            Waking up the API server. Free-tier hosting can take up to a minute on the first request.
          </div>
        )}

        {error && !loading ? (
          <ErrorState message={error} onRetry={retry} />
        ) : (
          <div className={loading && !firstLoad.current ? "is-refreshing" : ""}>
            <KpiCards summary={data?.summary} loading={!data} />

            {empty ? (
              <div className="card empty-block">
                <h3>No employees match these filters</h3>
                <p>Try removing a filter or choosing a different combination.</p>
                <button className="btn" onClick={() => setFilters(EMPTY_FILTERS)}>Clear filters</button>
              </div>
            ) : (
              <>
                <section className="grid" aria-label="Charts">
                  <ChartCard title="Headcount by position" subtitle="Employees per role" loading={!data}
                    isEmpty={data && !data.positions.length}>
                    <PositionHeadcountChart data={data?.positions} chart={chart} />
                  </ChartCard>
                  <ChartCard title="Department distribution" subtitle="Share of employees" loading={!data}
                    isEmpty={data && !data.departments.length}>
                    <DepartmentDonut data={data?.departments} allDepartments={options.departments} chart={chart} />
                  </ChartCard>
                  <ChartCard title="Average salary by position" subtitle="Annual salary, USD" loading={!data}
                    isEmpty={data && !data.positions.length}>
                    <SalaryByPositionChart data={data?.positions} chart={chart} />
                  </ChartCard>
                  <ChartCard
                    title="Hiring vs terminations"
                    subtitle={granularity === "year" ? "Per year" : "Per month"}
                    loading={!trend}
                    isEmpty={trend && !trend.points.length}
                    actions={
                      <div className="segmented" role="group" aria-label="Trend granularity">
                        {["year", "month"].map((g) => (
                          <button key={g} className={granularity === g ? "active" : ""} onClick={() => setGranularity(g)}>
                            {g === "year" ? "Year" : "Month"}
                          </button>
                        ))}
                      </div>
                    }
                  >
                    <TrendChart data={trend?.points} chart={chart} />
                  </ChartCard>
                  <ChartCard title="Performance distribution" subtitle="Employees per performance rating" loading={!data}
                    isEmpty={data && !data.performance.distribution.length}>
                    <PerformanceChart data={data?.performance.distribution} chart={chart} />
                  </ChartCard>
                  <ChartCard title="Performance by department" subtitle="Share of each rating within the department" loading={!data}
                    isEmpty={data && !data.performance.by_department.length}>
                    <PerformanceByDeptChart data={data?.performance} chart={chart} />
                  </ChartCard>
                  <ChartCard title="Termination reasons" subtitle="Terminated employees by stated reason" loading={!data}
                    isEmpty={data && !data.terminations.reasons.length} emptyText="No terminations in this selection.">
                    <TerminationReasonsChart data={data?.terminations} chart={chart} />
                  </ChartCard>
                  <ChartCard title="Recruitment source" subtitle="Hires by source, split by current status" loading={!data}
                    isEmpty={data && !data.recruitment.length}>
                    <RecruitmentChart data={data?.recruitment} chart={chart} />
                  </ChartCard>
                </section>

                <InsightsPanel insights={data?.insights.insights} loading={!data} />
                <AnalysisSection analysis={data?.analysis} loading={!data} />
              </>
            )}
          </div>
        )}

        <EmployeeTable filters={filters} reloadKey={reloadKey} />
      </main>
      <footer className="footer container">
        Data: <a href="https://www.kaggle.com/datasets/rhuebner/human-resources-data-set" target="_blank" rel="noreferrer">
          Human Resources Data Set by Dr. Rich Huebner (Kaggle)</a>. Built with React, Recharts, FastAPI and pandas.
      </footer>
    </div>
  );
}
