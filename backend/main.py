"""HR Analytics API (FastAPI + pandas)."""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import List, Literal, Optional

import pandas as pd
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

import analytics
from data_loader import load_and_clean
from schemas import (
    Analysis, DepartmentStat, EmployeePage, Filters, Insights, Meta, Performance,
    PositionStat, RecruitmentStat, Summary, Terminations, Trend,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("hr.api")

STATE: dict = {"df": None, "report": None, "error": None}


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        STATE["df"], STATE["report"] = load_and_clean()
    except Exception as exc:  # keep the server up so /api/health can explain the problem
        log.exception("Failed to load dataset")
        STATE["error"] = str(exc)
    yield


app = FastAPI(title="HR Analytics API", version="1.0.0", lifespan=lifespan)

# Comma-separated list of allowed origins, e.g. "https://my-app.vercel.app". Defaults to "*".
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled(request: Request, exc: Exception):
    log.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ---------- dependencies ----------

def get_df() -> pd.DataFrame:
    if STATE["df"] is None:
        raise HTTPException(status_code=503, detail=f"Dataset not loaded: {STATE['error']}")
    return STATE["df"]


def _values(raw: Optional[str]) -> List[str]:
    return [v.strip().lower() for v in raw.split(",") if v.strip()] if raw else []


def filtered(
    department: Optional[str] = Query(None, description="Department (comma-separated for several)"),
    position: Optional[str] = Query(None, description="Position (comma-separated for several)"),
    status: Optional[str] = Query(None, description="Employment status (comma-separated for several)"),
    df: pd.DataFrame = Depends(get_df),
) -> pd.DataFrame:
    mask = pd.Series(True, index=df.index)
    for col, raw in (("department", department), ("position", position), ("employment_status", status)):
        vals = _values(raw)
        if vals:
            mask &= df[col].str.lower().isin(vals)
    return df[mask]


# ---------- routes ----------

@app.get("/")
def root():
    return {"name": "HR Analytics API", "docs": "/docs", "health": "/api/health"}


@app.get("/api/health")
def health():
    ok = STATE["df"] is not None
    return {"status": "ok" if ok else "error", "rows": len(STATE["df"]) if ok else 0, "error": STATE["error"]}


@app.get("/api/meta", response_model=Meta)
def meta(_: pd.DataFrame = Depends(get_df)):
    return STATE["report"]


@app.get("/api/filters", response_model=Filters)
def filters(df: pd.DataFrame = Depends(get_df)):
    return {
        "departments": sorted(df["department"].unique().tolist()),
        "positions": sorted(df["position"].unique().tolist()),
        "statuses": sorted(df["employment_status"].unique().tolist()),
    }


@app.get("/api/summary", response_model=Summary)
def summary(df: pd.DataFrame = Depends(filtered)):
    return analytics.summary(df)


@app.get("/api/positions", response_model=List[PositionStat])
def positions(df: pd.DataFrame = Depends(filtered)):
    return analytics.positions(df)


@app.get("/api/departments", response_model=List[DepartmentStat])
def departments(df: pd.DataFrame = Depends(filtered)):
    return analytics.departments(df)


@app.get("/api/performance", response_model=Performance)
def performance(df: pd.DataFrame = Depends(filtered)):
    return analytics.performance(df)


@app.get("/api/trend", response_model=Trend)
def trend(granularity: Literal["year", "month"] = "year", df: pd.DataFrame = Depends(filtered)):
    return analytics.trend(df, granularity)


@app.get("/api/recruitment", response_model=List[RecruitmentStat])
def recruitment(df: pd.DataFrame = Depends(filtered)):
    return analytics.recruitment(df)


@app.get("/api/terminations", response_model=Terminations)
def terminations(df: pd.DataFrame = Depends(filtered)):
    return analytics.terminations(df)


@app.get("/api/employees", response_model=EmployeePage)
def employees(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    sort_by: str = Query("employee_name"),
    sort_dir: Literal["asc", "desc"] = "asc",
    df: pd.DataFrame = Depends(filtered),
):
    if sort_by not in analytics.SORTABLE:
        raise HTTPException(status_code=422, detail=f"sort_by must be one of {sorted(analytics.SORTABLE)}")
    return analytics.employees(df, page, page_size, search, sort_by, sort_dir)


@app.get("/api/insights", response_model=Insights)
def insights(df: pd.DataFrame = Depends(filtered)):
    return {"insights": analytics.insights(df)}


@app.get("/api/analysis", response_model=Analysis)
def analysis(df: pd.DataFrame = Depends(filtered)):
    return analytics.analysis(df)
