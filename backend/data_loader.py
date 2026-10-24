"""Load and clean the HR dataset once at startup.

Column names are matched flexibly (case, spaces and underscores are ignored), so
"DateofHire", "Date of Hire" and "date_of_hire" all map to the same field.
"""
from __future__ import annotations

import logging
import os
import re
from glob import glob
from pathlib import Path

import pandas as pd

log = logging.getLogger("hr.data")

DATA_DIR = Path(__file__).parent / "data"

# canonical name -> accepted normalized aliases (lowercase, alphanumerics only)
ALIASES: dict[str, list[str]] = {
    "employee_name": ["employeename", "name", "employee", "fullname"],
    "emp_id": ["empid", "employeeid", "employeenumber", "id"],
    "salary": ["salary", "annualsalary", "pay"],
    "position": ["position", "jobtitle", "role", "title", "jobrole"],
    "department": ["department", "dept"],
    "employment_status": ["employmentstatus", "status", "empstatus"],
    "termd": ["termd", "terminated"],
    "date_of_hire": ["dateofhire", "hiredate", "doh", "hiringdate"],
    "date_of_termination": ["dateoftermination", "terminationdate", "termdate", "dot"],
    "term_reason": ["termreason", "terminationreason", "reasonfortermination"],
    "recruitment_source": ["recruitmentsource", "source", "hiringsource"],
    "performance_score": ["performancescore", "performance", "performancerating"],
    "engagement_survey": ["engagementsurvey", "engagement", "engagementscore"],
    "emp_satisfaction": ["empsatisfaction", "satisfaction", "employeesatisfaction", "jobsatisfaction"],
    "absences": ["absences", "absence", "daysabsent"],
    "days_late_last30": ["dayslatelast30", "dayslate"],
    "special_projects_count": ["specialprojectscount", "specialprojects"],
    "manager_name": ["managername", "manager"],
    "sex": ["sex", "gender"],
    "dob": ["dob", "dateofbirth", "birthdate"],
    "race_desc": ["racedesc", "race"],
    "marital_desc": ["maritaldesc", "maritalstatus"],
    "state": ["state"],
    "last_review_date": ["lastperformancereviewdate", "lastreviewdate"],
}

TEXT_COLS = [
    "employee_name", "position", "department", "employment_status", "term_reason",
    "recruitment_source", "performance_score", "manager_name", "sex", "race_desc",
    "marital_desc", "state",
]
NUMERIC_COLS = [
    "salary", "absences", "engagement_survey", "emp_satisfaction",
    "days_late_last30", "special_projects_count", "termd",
]
DATE_COLS = ["date_of_hire", "date_of_termination", "dob", "last_review_date"]

PERFORMANCE_ORDER = ["Exceeds", "Fully Meets", "Needs Improvement", "PIP"]
STILL_EMPLOYED = "N/A - Still Employed"


def _norm(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(name).lower())


def _find_csv() -> Path:
    env_path = os.getenv("DATA_PATH")
    if env_path:
        return Path(env_path)
    preferred = DATA_DIR / "HRDataset_v14.csv"
    if preferred.exists():
        return preferred
    found = sorted(glob(str(DATA_DIR / "*.csv")))
    if not found:
        raise FileNotFoundError(
            f"No CSV found in {DATA_DIR}. Download HRDataset_v14.csv from Kaggle and place it there."
        )
    return Path(found[0])


def _rename_columns(df: pd.DataFrame) -> pd.DataFrame:
    lookup = {alias: canon for canon, aliases in ALIASES.items() for alias in aliases}
    rename, taken = {}, set()
    for col in df.columns:
        canon = lookup.get(_norm(col))
        if canon and canon not in taken:
            rename[col] = canon
            taken.add(canon)
    return df.rename(columns=rename)


def _parse_dates(s: pd.Series) -> pd.Series:
    try:
        return pd.to_datetime(s, errors="coerce", format="mixed")
    except (TypeError, ValueError):
        return pd.to_datetime(s, errors="coerce")


def load_and_clean() -> tuple[pd.DataFrame, dict]:
    path = _find_csv()
    try:
        raw = pd.read_csv(path, skipinitialspace=True)
    except UnicodeDecodeError:
        raw = pd.read_csv(path, skipinitialspace=True, encoding="latin-1")

    report: dict = {"source_file": path.name, "raw_rows": int(len(raw)), "raw_columns": int(raw.shape[1])}

    df = raw.copy()
    df.columns = [str(c).strip() for c in df.columns]
    df = df.dropna(how="all").dropna(axis=1, how="all")
    df = _rename_columns(df)

    missing_required = [c for c in ("department", "position") if c not in df.columns]
    if missing_required:
        raise ValueError(f"Dataset is missing required columns: {missing_required}. Found: {list(raw.columns)}")

    # Text: trim, collapse inner whitespace, treat blanks as missing
    for col in df.columns:
        if df[col].dtype == object or pd.api.types.is_string_dtype(df[col]):
            s = df[col].astype("string").str.strip().str.replace(r"\s+", " ", regex=True)
            df[col] = s.replace({"": pd.NA, "nan": pd.NA, "NaN": pd.NA, "None": pd.NA}).astype(object)

    report["missing_values_before"] = {
        c: int(n) for c, n in df.isna().sum().items() if n > 0
    }

    # Duplicates: exact rows, then repeated employee IDs
    before = len(df)
    df = df.drop_duplicates()
    if "emp_id" in df.columns:
        df = df.drop_duplicates(subset="emp_id", keep="first")
    report["duplicates_removed"] = int(before - len(df))

    # Numeric types
    for col in NUMERIC_COLS:
        if col in df.columns:
            cleaned = df[col].astype("string").str.replace(r"[$,\s]", "", regex=True)
            df[col] = pd.to_numeric(cleaned, errors="coerce")

    # Dates
    for col in DATE_COLS:
        if col in df.columns:
            df[col] = _parse_dates(df[col])

    # Two-digit birth years (e.g. "07/10/83") can parse into the future; shift back a century
    if "dob" in df.columns and "date_of_hire" in df.columns:
        bad = df["dob"].notna() & df["date_of_hire"].notna() & (df["dob"] > df["date_of_hire"])
        df.loc[bad, "dob"] = df.loc[bad, "dob"] - pd.DateOffset(years=100)

    # Make sure optional columns exist so every endpoint works
    for col in TEXT_COLS:
        if col not in df.columns:
            df[col] = pd.NA
    for col in NUMERIC_COLS:
        if col not in df.columns:
            df[col] = float("nan")
    for col in ("date_of_hire", "date_of_termination"):
        if col not in df.columns:
            df[col] = pd.NaT
    if "emp_id" not in df.columns:
        df["emp_id"] = range(1, len(df) + 1)

    # Termination flag: Termd column > status text > termination date
    status_text = df["employment_status"].astype("string").str.lower()
    if df["termd"].notna().any():
        terminated = df["termd"].fillna(0).astype(int) == 1
    elif status_text.notna().any():
        terminated = status_text.str.contains("terminat", na=False)
    else:
        terminated = df["date_of_termination"].notna()
    df["is_terminated"] = terminated.astype(bool)
    df["employment_status"] = df["employment_status"].fillna(
        df["is_terminated"].map({True: "Terminated", False: "Active"})
    )

    # Termination reason: active staff get a clear label, missing reasons for leavers become "Unknown"
    reason = df["term_reason"].astype("string")
    still = reason.str.lower().str.contains("still employed", na=False)
    df.loc[still | ~df["is_terminated"], "term_reason"] = STILL_EMPLOYED
    df.loc[df["is_terminated"] & df["term_reason"].isna(), "term_reason"] = "Unknown"

    # Impute numerics: salary by position median, others by overall median
    imputed: dict[str, int] = {}
    if df["salary"].isna().any():
        imputed["salary"] = int(df["salary"].isna().sum())
        df["salary"] = df["salary"].fillna(df.groupby("position")["salary"].transform("median"))
        df["salary"] = df["salary"].fillna(df["salary"].median())
    for col in ("absences", "engagement_survey", "emp_satisfaction", "days_late_last30", "special_projects_count"):
        n = int(df[col].isna().sum())
        if n and df[col].notna().any():
            imputed[col] = n
            df[col] = df[col].fillna(df[col].median())

    for col in TEXT_COLS:
        df[col] = df[col].fillna("Unknown")
    report["values_imputed"] = imputed

    # Derived fields
    date_cols = [c for c in ("date_of_hire", "date_of_termination", "last_review_date") if c in df.columns]
    ref = pd.concat([df[c] for c in date_cols]).max()
    if pd.isna(ref):
        ref = pd.Timestamp.today().normalize()
    end = df["date_of_termination"].where(df["is_terminated"] & df["date_of_termination"].notna(), ref)
    df["tenure_years"] = ((end - df["date_of_hire"]).dt.days / 365.25).round(2)
    df["employee_name"] = df["employee_name"].astype(str)

    report["rows_after_cleaning"] = int(len(df))
    report["reference_date"] = ref.date().isoformat()
    report["columns_used"] = sorted(c for c in ALIASES if c in df.columns)
    log.info("Loaded %s: %s rows -> %s rows", path.name, report["raw_rows"], report["rows_after_cleaning"])
    return df.reset_index(drop=True), report
