from typing import Dict, List, Optional

from pydantic import BaseModel


class Summary(BaseModel):
    total_employees: int
    active_employees: int
    terminated_employees: int
    attrition_rate: float
    avg_salary: Optional[float]
    total_payroll: float
    avg_absences: Optional[float]
    avg_engagement: Optional[float]
    avg_satisfaction: Optional[float]
    avg_tenure_years: Optional[float]


class PositionStat(BaseModel):
    position: str
    headcount: int
    active: int
    avg_salary: Optional[float]
    avg_absences: Optional[float]
    attrition_rate: float


class DepartmentStat(BaseModel):
    department: str
    headcount: int
    active: int
    terminated: int
    avg_salary: Optional[float]
    attrition_rate: float
    avg_engagement: Optional[float]


class ScoreCount(BaseModel):
    score: str
    count: int
    pct: float
    avg_salary: Optional[float]


class DepartmentPerformance(BaseModel):
    department: str
    total: int
    counts: Dict[str, int]


class Performance(BaseModel):
    scores: List[str]
    distribution: List[ScoreCount]
    by_department: List[DepartmentPerformance]


class TrendPoint(BaseModel):
    period: str
    hires: int
    terminations: int
    net: int


class Trend(BaseModel):
    granularity: str
    points: List[TrendPoint]


class RecruitmentStat(BaseModel):
    source: str
    headcount: int
    active: int
    terminated: int
    retention_rate: float


class ReasonCount(BaseModel):
    reason: str
    count: int
    pct: float


class TerminationTypeCount(BaseModel):
    type: str
    count: int


class Terminations(BaseModel):
    total_terminated: int
    reasons: List[ReasonCount]
    by_type: List[TerminationTypeCount]


class Employee(BaseModel):
    emp_id: str
    employee_name: str
    position: str
    department: str
    employment_status: str
    salary: Optional[float]
    performance_score: str
    engagement_survey: Optional[float]
    emp_satisfaction: Optional[float]
    absences: Optional[float]
    recruitment_source: str
    manager_name: str
    date_of_hire: Optional[str]
    date_of_termination: Optional[str]
    tenure_years: Optional[float]


class EmployeePage(BaseModel):
    items: List[Employee]
    total: int
    page: int
    page_size: int
    total_pages: int


class Insight(BaseModel):
    category: str
    text: str


class Insights(BaseModel):
    insights: List[Insight]


class ChartNote(BaseModel):
    chart: str
    text: str


class Analysis(BaseModel):
    chart_notes: List[ChartNote]
    findings: List[str]
    recommendations: List[str]


class Filters(BaseModel):
    departments: List[str]
    positions: List[str]
    statuses: List[str]


class Meta(BaseModel):
    source_file: str
    raw_rows: int
    raw_columns: int
    rows_after_cleaning: int
    duplicates_removed: int
    missing_values_before: Dict[str, int]
    values_imputed: Dict[str, int]
    reference_date: str
    columns_used: List[str]
