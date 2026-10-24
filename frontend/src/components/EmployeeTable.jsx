import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useDebounce } from "../hooks/useDebounce.js";
import { fmtMoney, fmtNumber } from "../utils/format.js";
import { EmptyState, ErrorState, Loader } from "./States.jsx";

const COLUMNS = [
  { key: "employee_name", label: "Name" },
  { key: "position", label: "Position" },
  { key: "department", label: "Department" },
  { key: "employment_status", label: "Status" },
  { key: "salary", label: "Salary", numeric: true, format: fmtMoney },
  { key: "performance_score", label: "Performance" },
  { key: "engagement_survey", label: "Engagement", numeric: true, format: (v) => fmtNumber(v, 2) },
  { key: "absences", label: "Absences", numeric: true, format: (v) => fmtNumber(v) },
  { key: "recruitment_source", label: "Source" },
  { key: "date_of_hire", label: "Hired" },
];

const statusClass = (s) => (/cause/i.test(s) ? "pill bad" : /terminat/i.test(s) ? "pill warn" : "pill good");

export default function EmployeeTable({ filters, reloadKey }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ by: "employee_name", dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retry, setRetry] = useState(0);
  const q = useDebounce(search);

  // Back to page 1 when the query changes
  useEffect(() => setPage(1), [filters, q, sort, pageSize]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api
      .employees({ ...filters, search: q, sort_by: sort.by, sort_dir: sort.dir, page, page_size: pageSize }, { signal: ctrl.signal })
      .then((r) => {
        setResult(r);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => ctrl.abort();
  }, [filters, q, sort, page, pageSize, reloadKey, retry]);

  const toggleSort = (key) =>
    setSort((s) => (s.by === key ? { by: key, dir: s.dir === "asc" ? "desc" : "asc" } : { by: key, dir: "asc" }));

  const from = result && result.total ? (result.page - 1) * result.page_size + 1 : 0;
  const to = result ? Math.min(result.page * result.page_size, result.total) : 0;

  return (
    <section className="card section" aria-labelledby="table-title">
      <div className="section-head table-head">
        <div>
          <h2 id="table-title">Employees</h2>
          <p className="muted">{result ? `${fmtNumber(result.total)} matching employees` : " "}</p>
        </div>
        <div className="table-tools">
          <div className="mobile-sort">
            <select value={sort.by} onChange={(e) => setSort((s) => ({ ...s, by: e.target.value }))} aria-label="Sort by">
              {COLUMNS.map((c) => <option key={c.key} value={c.key}>Sort: {c.label}</option>)}
            </select>
            <button className="btn ghost" onClick={() => setSort((s) => ({ ...s, dir: s.dir === "asc" ? "desc" : "asc" }))}
              aria-label="Toggle sort direction">{sort.dir === "asc" ? "▲" : "▼"}</button>
          </div>
          <input
          type="search"
          className="search"
          placeholder="Search name, role, department, manager…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search employees"
          />
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => setRetry((n) => n + 1)} />
      ) : !result && loading ? (
        <Loader />
      ) : result.items.length === 0 ? (
        <EmptyState text={q ? `No employees match "${q}".` : "No employees match the selected filters."} />
      ) : (
        <div className={`table-wrap${loading ? " is-refreshing" : ""}`}>
          <table>
            <thead>
              <tr>
                {COLUMNS.map((c) => {
                  const active = sort.by === c.key;
                  return (
                    <th key={c.key} className={c.numeric ? "num" : ""}
                      aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                      <button onClick={() => toggleSort(c.key)} className={active ? "active" : ""}>
                        {c.label}
                        <span className="sort-icon" aria-hidden="true">{active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {result.items.map((e) => (
                <tr key={e.emp_id}>
                  {COLUMNS.map((c) => (
                    <td key={c.key} data-label={c.label} className={c.numeric ? "num" : ""}>
                      {c.key === "employment_status" ? (
                        <span className={statusClass(e[c.key])}>{e[c.key]}</span>
                      ) : c.format ? (
                        c.format(e[c.key])
                      ) : (
                        e[c.key] ?? "–"
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result && result.total > 0 && !error && (
        <div className="pagination">
          <span className="muted">
            {fmtNumber(from)}–{fmtNumber(to)} of {fmtNumber(result.total)}
          </span>
          <div className="pager">
            <label className="page-size">
              Rows
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                {[10, 25, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <button className="btn ghost" onClick={() => setPage(1)} disabled={result.page <= 1} aria-label="First page">«</button>
            <button className="btn ghost" onClick={() => setPage((p) => p - 1)} disabled={result.page <= 1}>Prev</button>
            <span className="page-num">{result.page} / {result.total_pages}</span>
            <button className="btn ghost" onClick={() => setPage((p) => p + 1)} disabled={result.page >= result.total_pages}>Next</button>
            <button className="btn ghost" onClick={() => setPage(result.total_pages)} disabled={result.page >= result.total_pages} aria-label="Last page">»</button>
          </div>
        </div>
      )}
    </section>
  );
}
