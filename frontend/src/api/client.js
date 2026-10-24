const BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export const isApiConfigured = Boolean(BASE_URL);

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") qs.append(key, value);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export async function apiGet(path, params, { signal } = {}) {
  if (!BASE_URL) {
    throw new Error("VITE_API_URL is not set. Add it to frontend/.env (local) or Vercel environment variables.");
  }
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, { signal });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new Error("Cannot reach the API server. It may be starting up; please retry in a few seconds.");
  }
  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* non-JSON error body */
    }
    throw new Error(`API error: ${detail}`);
  }
  return res.json();
}

export const api = {
  filters: (opts) => apiGet("/api/filters", {}, opts),
  summary: (f, opts) => apiGet("/api/summary", f, opts),
  positions: (f, opts) => apiGet("/api/positions", f, opts),
  departments: (f, opts) => apiGet("/api/departments", f, opts),
  performance: (f, opts) => apiGet("/api/performance", f, opts),
  trend: (f, opts) => apiGet("/api/trend", f, opts),
  recruitment: (f, opts) => apiGet("/api/recruitment", f, opts),
  terminations: (f, opts) => apiGet("/api/terminations", f, opts),
  employees: (f, opts) => apiGet("/api/employees", f, opts),
  insights: (f, opts) => apiGet("/api/insights", f, opts),
  analysis: (f, opts) => apiGet("/api/analysis", f, opts),
};
