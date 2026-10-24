export const fmtNumber = (v, digits = 0) =>
  v === null || v === undefined || Number.isNaN(v)
    ? "–"
    : Number(v).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmtMoney = (v) => (v === null || v === undefined ? "–" : `$${fmtNumber(v)}`);

export const fmtMoneyShort = (v) => {
  if (v === null || v === undefined) return "–";
  const a = Math.abs(v);
  if (a >= 1e6) return `$${(v / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e3) return `$${Math.round(v / 1e3)}k`;
  return `$${Math.round(v)}`;
};

export const fmtPct = (v, digits = 1) => (v === null || v === undefined ? "–" : `${Number(v).toFixed(digits)}%`);

export const truncate = (s, n = 18) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s);
