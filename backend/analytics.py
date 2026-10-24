"""All aggregations used by the API. Every function takes an already-filtered DataFrame."""
from __future__ import annotations

import math
from typing import Optional

import pandas as pd

from data_loader import PERFORMANCE_ORDER, STILL_EMPLOYED


# ---------- helpers ----------

def num(x, digits: int = 2) -> Optional[float]:
    """Round to a JSON-safe float (NaN/inf -> None)."""
    if x is None:
        return None
    try:
        x = float(x)
    except (TypeError, ValueError):
        return None
    if math.isnan(x) or math.isinf(x):
        return None
    return round(x, digits)


def pct(part: float, whole: float) -> float:
    return round(part / whole * 100, 1) if whole else 0.0


def money(x) -> str:
    return f"${x:,.0f}" if x is not None and not pd.isna(x) else "n/a"


def min_group(df: pd.DataFrame) -> int:
    """Smallest group size we trust for 'highest/lowest' comparisons."""
    return 5 if len(df) >= 50 else 1


def ordered_scores(df: pd.DataFrame) -> list[str]:
    present = [s for s in df["performance_score"].dropna().unique() if s != "Unknown"]
    known = [s for s in PERFORMANCE_ORDER if s in present]
    return known + sorted(s for s in present if s not in known)


def group_stats(df: pd.DataFrame, key: str) -> pd.DataFrame:
    g = df.groupby(key, observed=True)
    out = pd.DataFrame({
        "headcount": g.size(),
        "terminated": g["is_terminated"].sum(),
        "avg_salary": g["salary"].mean(),
        "avg_absences": g["absences"].mean(),
        "avg_engagement": g["engagement_survey"].mean(),
    })
    out["active"] = out["headcount"] - out["terminated"]
    out["attrition_rate"] = (out["terminated"] / out["headcount"] * 100).round(1)
    out["retention_rate"] = (out["active"] / out["headcount"] * 100).round(1)
    return out.reset_index()


# ---------- endpoints ----------

def summary(df: pd.DataFrame) -> dict:
    total = len(df)
    terminated = int(df["is_terminated"].sum())
    active = total - terminated
    return {
        "total_employees": total,
        "active_employees": active,
        "terminated_employees": terminated,
        "attrition_rate": pct(terminated, total),
        "avg_salary": num(df["salary"].mean()),
        # Payroll = annual salaries of currently active employees
        "total_payroll": num(df.loc[~df["is_terminated"], "salary"].sum()) or 0.0,
        "avg_absences": num(df["absences"].mean()),
        "avg_engagement": num(df["engagement_survey"].mean()),
        "avg_satisfaction": num(df["emp_satisfaction"].mean()),
        "avg_tenure_years": num(df["tenure_years"].mean()),
    }


def positions(df: pd.DataFrame) -> list[dict]:
    if df.empty:
        return []
    s = group_stats(df, "position").sort_values(["headcount", "avg_salary"], ascending=[False, False])
    return [{
        "position": r.position, "headcount": int(r.headcount), "active": int(r.active),
        "avg_salary": num(r.avg_salary), "avg_absences": num(r.avg_absences),
        "attrition_rate": float(r.attrition_rate),
    } for r in s.itertuples()]


def departments(df: pd.DataFrame) -> list[dict]:
    if df.empty:
        return []
    s = group_stats(df, "department").sort_values("headcount", ascending=False)
    return [{
        "department": r.department, "headcount": int(r.headcount), "active": int(r.active),
        "terminated": int(r.terminated), "avg_salary": num(r.avg_salary),
        "attrition_rate": float(r.attrition_rate), "avg_engagement": num(r.avg_engagement),
    } for r in s.itertuples()]


def performance(df: pd.DataFrame) -> dict:
    scores = ordered_scores(df)
    total = len(df)
    dist = []
    for sc in scores:
        sub = df[df["performance_score"] == sc]
        dist.append({"score": sc, "count": int(len(sub)), "pct": pct(len(sub), total),
                     "avg_salary": num(sub["salary"].mean())})
    by_dept = []
    if not df.empty:
        ct = pd.crosstab(df["department"], df["performance_score"])
        for dept in ct.sum(axis=1).sort_values(ascending=False).index:
            counts = {sc: int(ct.loc[dept, sc]) if sc in ct.columns else 0 for sc in scores}
            by_dept.append({"department": dept, "total": int(ct.loc[dept].sum()), "counts": counts})
    return {"scores": scores, "distribution": dist, "by_department": by_dept}


def trend(df: pd.DataFrame, granularity: str = "year") -> dict:
    freq = "M" if granularity == "month" else "Y"
    fmt = "%Y-%m" if freq == "M" else "%Y"
    hires = df["date_of_hire"].dropna().dt.to_period(freq).value_counts()
    terms = df.loc[df["is_terminated"], "date_of_termination"].dropna().dt.to_period(freq).value_counts()
    if hires.empty and terms.empty:
        return {"granularity": granularity, "points": []}
    periods = pd.period_range(min(hires.index.min() if not hires.empty else terms.index.min(),
                                  terms.index.min() if not terms.empty else hires.index.min()),
                              max(hires.index.max() if not hires.empty else terms.index.max(),
                                  terms.index.max() if not terms.empty else hires.index.max()),
                              freq=freq)
    points = []
    for p in periods:
        h, t = int(hires.get(p, 0)), int(terms.get(p, 0))
        points.append({"period": p.strftime(fmt), "hires": h, "terminations": t, "net": h - t})
    return {"granularity": granularity, "points": points}


def recruitment(df: pd.DataFrame) -> list[dict]:
    if df.empty:
        return []
    s = group_stats(df, "recruitment_source").sort_values("headcount", ascending=False)
    return [{
        "source": r.recruitment_source, "headcount": int(r.headcount), "active": int(r.active),
        "terminated": int(r.terminated), "retention_rate": float(r.retention_rate),
    } for r in s.itertuples()]


def terminations(df: pd.DataFrame) -> dict:
    t = df[df["is_terminated"]]
    total = len(t)
    reasons = t.loc[t["term_reason"] != STILL_EMPLOYED, "term_reason"].value_counts()
    types = t["employment_status"].value_counts()
    return {
        "total_terminated": total,
        "reasons": [{"reason": str(k), "count": int(v), "pct": pct(v, total)} for k, v in reasons.items()],
        "by_type": [{"type": str(k), "count": int(v)} for k, v in types.items()],
    }


SORTABLE = {
    "emp_id", "employee_name", "position", "department", "employment_status", "salary",
    "performance_score", "engagement_survey", "emp_satisfaction", "absences",
    "recruitment_source", "manager_name", "date_of_hire", "date_of_termination", "tenure_years",
}


def employees(df: pd.DataFrame, page: int, page_size: int, search: str | None,
              sort_by: str, sort_dir: str) -> dict:
    data = df
    if search:
        q = search.strip().lower()
        hay = (data["employee_name"] + " " + data["position"] + " " + data["department"] + " "
               + data["manager_name"] + " " + data["emp_id"].astype(str)).str.lower()
        data = data[hay.str.contains(q, regex=False, na=False)]
    if sort_by not in SORTABLE:
        sort_by = "employee_name"
    data = data.sort_values(sort_by, ascending=(sort_dir != "desc"), na_position="last", kind="stable")
    total = len(data)
    total_pages = max(1, math.ceil(total / page_size))
    page = min(page, total_pages)
    chunk = data.iloc[(page - 1) * page_size: page * page_size]

    def d(x):
        return x.date().isoformat() if pd.notna(x) else None

    items = [{
        "emp_id": str(r.emp_id), "employee_name": r.employee_name, "position": r.position,
        "department": r.department, "employment_status": r.employment_status,
        "salary": num(r.salary), "performance_score": r.performance_score,
        "engagement_survey": num(r.engagement_survey), "emp_satisfaction": num(r.emp_satisfaction),
        "absences": num(r.absences), "recruitment_source": r.recruitment_source,
        "manager_name": r.manager_name, "date_of_hire": d(r.date_of_hire),
        "date_of_termination": d(r.date_of_termination), "tenure_years": num(r.tenure_years),
    } for r in chunk.itertuples()]
    return {"items": items, "total": total, "page": page, "page_size": page_size, "total_pages": total_pages}


# ---------- computed insights ----------

def insights(df: pd.DataFrame) -> list[dict]:
    out: list[dict] = []
    if df.empty:
        return out
    n_min = min_group(df)
    overall_attr = pct(df["is_terminated"].sum(), len(df))

    pos = group_stats(df, "position")
    pos_ok = pos[pos["headcount"] >= n_min]
    if len(pos_ok) >= 2:
        top, low = pos_ok.loc[pos_ok["avg_salary"].idxmax()], pos_ok.loc[pos_ok["avg_salary"].idxmin()]
        out.append({"category": "Compensation", "text":
            f"{top.position} is the best-paid role (avg {money(top.avg_salary)}, {int(top.headcount)} staff), "
            f"{top.avg_salary / low.avg_salary:.1f}x the lowest-paid role, {low.position} ({money(low.avg_salary)})."})

    dep = group_stats(df, "department")
    dep_ok = dep[dep["headcount"] >= n_min]
    if len(dep_ok) >= 2:
        hi = dep_ok.loc[dep_ok["attrition_rate"].idxmax()]
        out.append({"category": "Attrition", "text":
            f"{hi.department} has the highest attrition: {hi.attrition_rate:.1f}% "
            f"({int(hi.terminated)} of {int(hi.headcount)}) vs {overall_attr:.1f}% overall."})

    rec = group_stats(df, "recruitment_source")
    rec_ok = rec[rec["headcount"] >= n_min]
    if len(rec_ok) >= 2:
        best, worst = rec_ok.loc[rec_ok["retention_rate"].idxmax()], rec_ok.loc[rec_ok["retention_rate"].idxmin()]
        out.append({"category": "Recruitment", "text":
            f"{best.recruitment_source} hires retain best ({best.retention_rate:.1f}% still active, n={int(best.headcount)}); "
            f"{worst.recruitment_source} retains worst ({worst.retention_rate:.1f}%, n={int(worst.headcount)})."})

    t = df[df["is_terminated"]]
    reasons = t.loc[t["term_reason"] != STILL_EMPLOYED, "term_reason"].value_counts()
    if not reasons.empty:
        vol = t["employment_status"].str.contains("volunt", case=False, na=False).sum()
        out.append({"category": "Exits", "text":
            f"Top exit reason is \"{reasons.index[0]}\" ({int(reasons.iloc[0])} exits, {pct(reasons.iloc[0], len(t)):.1f}% "
            f"of {len(t)}); {pct(vol, len(t)):.1f}% of all exits were voluntary."})

    scores = ordered_scores(df)
    perf = df.groupby("performance_score")["salary"].mean()
    if "Exceeds" in perf and any(s in perf for s in ("PIP", "Needs Improvement")):
        weak = df[df["performance_score"].isin(["PIP", "Needs Improvement"])]["salary"].mean()
        out.append({"category": "Performance", "text":
            f"Employees rated Exceeds earn {money(perf['Exceeds'])} on average vs {money(weak)} for "
            f"Needs Improvement/PIP (difference {'+' if perf['Exceeds'] >= weak else '-'}{money(abs(perf['Exceeds'] - weak))})."})
    elif len(scores) >= 2:
        top = df["performance_score"].value_counts()
        out.append({"category": "Performance", "text":
            f"Most common rating is {top.index[0]} ({pct(top.iloc[0], len(df)):.1f}% of employees)."})

    if df["is_terminated"].any() and (~df["is_terminated"]).any():
        e_act = df.loc[~df["is_terminated"], "engagement_survey"].mean()
        e_ter = df.loc[df["is_terminated"], "engagement_survey"].mean()
        if pd.notna(e_act) and pd.notna(e_ter):
            out.append({"category": "Engagement", "text":
                f"Average engagement is {e_act:.2f}/5 for active staff vs {e_ter:.2f}/5 for those who left "
                f"(difference {e_act - e_ter:+.2f})."})

    hi_abs = pos_ok.loc[pos_ok["avg_absences"].idxmax()] if len(pos_ok) else None
    if hi_abs is not None and pd.notna(hi_abs.avg_absences):
        out.append({"category": "Absences", "text":
            f"{hi_abs.position} has the most absences ({hi_abs.avg_absences:.1f} days avg) vs "
            f"{df['absences'].mean():.1f} company-wide."})

    sex = df[df["sex"].isin(["M", "F"])]
    if sex["sex"].nunique() == 2:
        m, f = sex.groupby("sex")["salary"].mean().reindex(["M", "F"])
        out.append({"category": "Pay equity", "text":
            f"Average salary: men {money(m)} vs women {money(f)} "
            f"({(m - f) / f * 100:+.1f}% for men; not adjusted for role)."})

    leavers = t["tenure_years"].dropna()
    if len(out) < 8 and len(leavers) >= n_min:
        out.append({"category": "Tenure", "text":
            f"Employees who left stayed {leavers.mean():.1f} years on average (median {leavers.median():.1f})."})

    return out[:8]


# ---------- written analysis ----------

ACTIONS = {
    "another position": "run stay interviews and benchmark pay/career paths, since leavers are taking other jobs",
    "more money": "benchmark salaries against the market for the affected roles",
    "unhappy": "act on engagement survey results with manager-level follow-ups",
    "career change": "publish internal career paths and an internal mobility programme",
    "attendance": "introduce early attendance coaching before issues lead to termination",
    "hours": "pilot flexible or predictable shift scheduling",
    "performance": "set up structured performance improvement plans with monthly check-ins",
    "relocation": "offer remote or transfer options where roles allow",
    "no-call": "tighten attendance monitoring and supervisor check-ins",
}


def analysis(df: pd.DataFrame) -> dict:
    notes, findings, recs = [], [], []
    if df.empty:
        return {"chart_notes": [], "findings": ["No employees match the selected filters."], "recommendations": []}
    total = len(df)
    n_min = min_group(df)
    overall_attr = pct(df["is_terminated"].sum(), total)

    pos = group_stats(df, "position").sort_values("headcount", ascending=False)
    top3 = pos.head(3)["headcount"].sum()
    p0 = pos.iloc[0]
    notes.append({"chart": "Headcount by position", "text":
        f"{p0.position} is the largest role with {int(p0.headcount)} employees ({pct(p0.headcount, total):.1f}%). "
        f"The top 3 roles make up {pct(top3, total):.1f}% of the workforce across {len(pos)} roles."})

    dep = group_stats(df, "department").sort_values("headcount", ascending=False)
    d0 = dep.iloc[0]
    notes.append({"chart": "Department distribution", "text":
        f"{d0.department} holds {pct(d0.headcount, total):.1f}% of employees ({int(d0.headcount)}) "
        f"out of {len(dep)} {'department' if len(dep) == 1 else 'departments'} in view."})

    pos_ok = pos[pos["headcount"] >= n_min]
    if len(pos_ok) >= 2:
        hi, lo = pos_ok.loc[pos_ok["avg_salary"].idxmax()], pos_ok.loc[pos_ok["avg_salary"].idxmin()]
        notes.append({"chart": "Average salary by position", "text":
            f"Among roles with at least {n_min} employees, {hi.position} pays most ({money(hi.avg_salary)}) "
            f"and {lo.position} least ({money(lo.avg_salary)})."})

    tr = trend(df)["points"]
    if tr:
        ph = max(tr, key=lambda p: p["hires"])
        pt = max(tr, key=lambda p: p["terminations"])
        notes.append({"chart": "Hiring vs termination trend", "text":
            f"Hiring peaked in {ph['period']} ({ph['hires']} hires); terminations peaked in {pt['period']} "
            f"({pt['terminations']}). Net change over the period: {sum(p['net'] for p in tr):+d}."})

    perf = performance(df)
    dist = {d["score"]: d for d in perf["distribution"]}
    if dist:
        good = sum(dist[s]["count"] for s in ("Exceeds", "Fully Meets") if s in dist)
        weak = sum(dist[s]["count"] for s in ("Needs Improvement", "PIP") if s in dist)
        notes.append({"chart": "Performance distribution", "text":
            f"{pct(good, total):.1f}% are rated Fully Meets or Exceeds; {weak} employees ({pct(weak, total):.1f}%) "
            f"are on Needs Improvement or PIP."})

    term = terminations(df)
    if term["reasons"]:
        r0 = term["reasons"][0]
        notes.append({"chart": "Termination reasons", "text":
            f"\"{r0['reason']}\" is the leading exit reason ({r0['count']} of {term['total_terminated']} exits, {r0['pct']:.1f}%)."})

    rec = group_stats(df, "recruitment_source")
    rec_ok = rec[rec["headcount"] >= n_min]
    if len(rec_ok) >= 2:
        big = rec.loc[rec["headcount"].idxmax()]
        best, worst = rec_ok.loc[rec_ok["retention_rate"].idxmax()], rec_ok.loc[rec_ok["retention_rate"].idxmin()]
        notes.append({"chart": "Recruitment source", "text":
            f"{big.recruitment_source} brings in the most hires ({int(big.headcount)}). Retention ranges from "
            f"{best.retention_rate:.1f}% ({best.recruitment_source}) to {worst.retention_rate:.1f}% ({worst.recruitment_source})."})

    # Key findings
    dep_ok = dep[dep["headcount"] >= n_min]
    if len(dep_ok) >= 2:
        pay = dep_ok.loc[dep_ok["avg_salary"].idxmax()]
        att = dep_ok.loc[dep_ok["attrition_rate"].idxmax()]
        findings.append(f"Highest-paying department: {pay.department} (avg {money(pay.avg_salary)}, "
                        f"company avg {money(df['salary'].mean())}).")
        findings.append(f"Highest attrition: {att.department} at {att.attrition_rate:.1f}% vs {overall_attr:.1f}% overall "
                        f"({int(att.terminated)} of {int(att.headcount)} employees left).")
    if len(pos_ok) >= 2:
        ab = pos_ok.loc[pos_ok["avg_absences"].idxmax()]
        findings.append(f"Most absences by role: {ab.position} ({ab.avg_absences:.1f} days avg vs "
                        f"{df['absences'].mean():.1f} overall).")
    if len(rec_ok) >= 2 and best.retention_rate != worst.retention_rate:
        findings.append(f"Best-retaining recruitment source: {best.recruitment_source} ({best.retention_rate:.1f}% still employed, "
                        f"n={int(best.headcount)}); weakest: {worst.recruitment_source} ({worst.retention_rate:.1f}%).")
    if df["is_terminated"].any() and (~df["is_terminated"]).any():
        e_act = df.loc[~df["is_terminated"], "engagement_survey"].mean()
        e_ter = df.loc[df["is_terminated"], "engagement_survey"].mean()
        if pd.notna(e_act) and pd.notna(e_ter):
            findings.append(f"Leavers scored {e_ter:.2f}/5 on engagement vs {e_act:.2f}/5 for current staff.")

    # Recommendations (choice of action is driven by the numbers above)
    if len(dep_ok) >= 2 and att.attrition_rate > overall_attr:
        recs.append(f"Prioritise retention in {att.department}: its attrition ({att.attrition_rate:.1f}%) is "
                    f"{att.attrition_rate - overall_attr:.1f} points above the company rate. Start exit and stay interviews there first.")
    if len(rec_ok) >= 2 and best.retention_rate - worst.retention_rate >= 5:
        recs.append(f"Shift recruiting effort toward {best.recruitment_source} ({best.retention_rate:.1f}% retention) and review "
                    f"spend on {worst.recruitment_source} ({worst.retention_rate:.1f}%).")
    vol = df[df["is_terminated"] & df["employment_status"].str.contains("volunt", case=False, na=False)]
    vr = vol["term_reason"].value_counts()
    if not vr.empty:
        reason = str(vr.index[0])
        action = next((a for k, a in ACTIONS.items() if k in reason.lower()),
                      "investigate this reason through structured exit interviews")
        recs.append(f"The top voluntary exit reason is \"{reason}\" ({int(vr.iloc[0])} of {len(vol)} voluntary exits): {action}.")

    return {"chart_notes": notes, "findings": findings[:5], "recommendations": recs[:3]}
