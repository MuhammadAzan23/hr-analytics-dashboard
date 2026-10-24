# HR Analytics Dashboard

A full-stack HR analytics dashboard built for the Saylani IT Training hackathon. It loads the Kaggle **Human Resources Data Set**, cleans it with pandas, and shows workforce, compensation, performance, attrition and recruitment analysis in an interactive React dashboard. Every KPI, chart, insight and written finding is computed from the data at request time and responds to the filters.

- **Live demo:** `https://<your-app>.vercel.app` _(add after deploying)_
- **API:** `https://<your-api>.onrender.com/docs`

## Dataset

- **Source:** [Human Resources Data Set by Dr. Rich Huebner (Kaggle)](https://www.kaggle.com/datasets/rhuebner/human-resources-data-set). File used: `HRDataset_v14.csv` (≈311 employees, 36 columns).
- **Key columns used:** `Employee_Name, EmpID, Salary, Position, Department, EmploymentStatus, Termd, DateofHire, DateofTermination, TermReason, RecruitmentSource, PerformanceScore, EngagementSurvey, EmpSatisfaction, Absences, DaysLateLast30, ManagerName, Sex`.
- **Roles in the data** include Production Technician I/II, Production Manager, Area Sales Manager, Sales Manager, Accountant I, Sr. Accountant, Administrative Assistant, Shared Services Manager, Network Engineer, Database Administrator, IT Support, Data Analyst, Software Engineer, President & CEO and more. The live list comes from `GET /api/filters`.

### Cleaning steps (`backend/data_loader.py`)

| Issue | Handling |
|---|---|
| Column names vary (`DateofHire`, `Date of Hire`, …) | Matched case- and space-insensitively against an alias table |
| Trailing spaces (e.g. `"Production       "`, `"Data Analyst "`) | All text trimmed, inner whitespace collapsed |
| Blank strings | Treated as missing |
| Duplicate rows / repeated `EmpID` | Removed (first occurrence kept) |
| Dates as text (`m/d/yyyy`), 2-digit birth years | Parsed to datetimes; a DOB after the hire date is moved back 100 years |
| `DateofTermination` empty for active staff | Expected; kept as null |
| `TermReason = "N/A-StillEmployed"` | Normalised to `N/A - Still Employed` and excluded from exit analysis |
| Missing salary | Filled with the median for that position |
| Missing absences/engagement/satisfaction | Filled with the column median |
| Missing categorical values | `"Unknown"` |
| Derived fields | `is_terminated` (from `Termd`, falling back to status text or termination date) and `tenure_years` (measured to the latest date in the dataset, not today) |

`GET /api/meta` returns the cleaning report (raw rows, duplicates removed, missing values per column, imputations).

## Tech stack

- **Frontend:** React 18 (Vite), Recharts, plain CSS (responsive, dark/light mode)
- **Backend:** Python, FastAPI, pandas, Pydantic
- **Hosting:** Vercel (frontend), Render free tier (backend)

## Project structure

```
hr-analytics-dashboard/
├── backend/
│   ├── main.py              # FastAPI app, routes, filters, CORS, error handling
│   ├── data_loader.py       # CSV loading and cleaning (runs once at startup)
│   ├── analytics.py         # aggregations, insights and written analysis
│   ├── schemas.py           # Pydantic response models
│   ├── generate_report.py   # prints the analysis as Markdown for this README
│   ├── requirements.txt
│   ├── .python-version
│   └── data/HRDataset_v14.csv   # put the Kaggle CSV here
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # fetch wrapper (uses VITE_API_URL)
│   │   ├── components/          # Header, FilterBar, KpiCards, tables, panels
│   │   │   └── charts/          # Recharts components
│   │   ├── hooks/               # useTheme, useDebounce
│   │   ├── pages/Dashboard.jsx
│   │   ├── utils/format.js
│   │   ├── theme.js             # chart colors per theme
│   │   └── index.css
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── render.yaml                  # optional Render blueprint
└── .github/workflows/keep-warm.yml  # pings the API so Render doesn't sleep
```

## Run locally

Prerequisites: Python 3.10+ and Node 18+.

```bash
# 1. Backend
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
# download HRDataset_v14.csv from Kaggle into backend/data/
uvicorn main:app --reload --port 8000
# open http://localhost:8000/docs

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env             # VITE_API_URL=http://localhost:8000
npm install
npm run dev
# open http://localhost:5173
```

## API

All analytics endpoints accept the optional query filters `department`, `position` and `status`. Matching is case-insensitive, and you can pass several values separated by commas.

| Method | Endpoint | Returns |
|---|---|---|
| GET | `/api/health` | Status and row count (use for warm-up pings) |
| GET | `/api/filters` | `{departments[], positions[], statuses[]}` |
| GET | `/api/summary` | Totals, active/terminated, attrition %, avg salary, payroll, avg absences, engagement, satisfaction, tenure |
| GET | `/api/positions` | Per role: headcount, active, avg salary, avg absences, attrition % |
| GET | `/api/departments` | Per department: headcount, active, terminated, avg salary, attrition %, engagement |
| GET | `/api/performance` | Score distribution and score counts by department |
| GET | `/api/trend?granularity=year\|month` | Hires, terminations and net change per period |
| GET | `/api/recruitment` | Per source: headcount, active, terminated, retention % |
| GET | `/api/terminations` | Exit reasons (count, %) and voluntary vs for-cause split |
| GET | `/api/employees?page=&page_size=&search=&sort_by=&sort_dir=` | Paginated, searchable, sortable employee list |
| GET | `/api/insights` | 5–8 computed insights (text with supporting numbers) |
| GET | `/api/analysis` | Written chart notes, key findings and recommendations |
| GET | `/api/meta` | Data cleaning report |

Interactive docs are at `/docs` (Swagger).

## Deployment

### 1. Push to GitHub

```bash
git init && git add . && git commit -m "HR analytics dashboard"
git branch -M main
git remote add origin https://github.com/<you>/hr-analytics-dashboard.git
git push -u origin main
```

Make sure `backend/data/HRDataset_v14.csv` is committed. Render needs it, and the dataset is public on Kaggle.

### 2. Backend on Render (free)

1. Go to [render.com](https://render.com) and choose **New → Web Service**, then connect the GitHub repo.
2. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance type:** Free
   - **Health Check Path:** `/api/health`
3. Environment variables:
   - `PYTHON_VERSION` = `3.12.8`
   - `CORS_ORIGINS` = `https://<your-app>.vercel.app` (comma-separated list; `*` also works)
4. Deploy, then open `https://<your-api>.onrender.com/api/health` and check that it returns `"status":"ok"`.

(Alternatively, use **New → Blueprint**, which reads `render.yaml`.)

### 3. Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and choose **Add New → Project**, then import the repo.
2. **Root Directory:** `frontend`. Vercel detects the Vite framework automatically (build `npm run build`, output `dist`).
3. Environment variable: `VITE_API_URL` = `https://<your-api>.onrender.com` (no trailing slash).
4. Deploy. If you change `VITE_API_URL` later, **redeploy**, because Vite bakes the value in at build time.
5. Put the Vercel URL into Render's `CORS_ORIGINS` and redeploy the backend.

### 4. Avoiding Render's cold start before the demo

Free Render services sleep after about 15 minutes without traffic, and the first request then takes roughly 30–60 seconds.

- **Before presenting:** open `https://<your-api>.onrender.com/api/health` 2–3 minutes ahead and wait for `ok`, then load the dashboard.
- **Keep it awake:** this repo includes `.github/workflows/keep-warm.yml`, which pings the API every 10 minutes. In GitHub, go to *Settings → Secrets and variables → Actions → Variables* and add `API_URL` = `https://<your-api>.onrender.com`. GitHub cron can be delayed, so for a guaranteed demo window also add a free monitor on [UptimeRobot](https://uptimerobot.com) or [cron-job.org](https://cron-job.org) hitting `/api/health` every 5 minutes.
- The frontend shows a "waking up the server" notice if the API takes longer than 4 seconds, so judges know it is loading and not broken.

## Screenshots

> Add screenshots after deploying (`docs/screenshots/`):
>
> - `desktop-light.png`: full dashboard
> - `desktop-dark.png`: dark mode
> - `mobile.png`: phone view

## Analysis summary

The dashboard's **Insights** and **Analysis** sections compute these statements live from the data, and they update with the filters. To produce the full-dataset version for this README, run:

```bash
cd backend && python generate_report.py
```

Then paste the output below.

<!-- Dataset: HRDataset_v14.csv, 311 raw rows -> 311 after cleaning (0 duplicates removed).

- Employees: 311 (207 active, 104 terminated)
- Attrition rate: 33.4%
- Average salary: $69,021; annual payroll (active): $14,633,665
- Average absences: 10.24; engagement 4.11/5; satisfaction 3.89/5

**What each chart shows**

- **Headcount by position**: Production Technician I is the largest role with 137 employees (44.1%). The top 3 roles make up 71.1% of the workforce across 31 roles.
- **Department distribution**: Production holds 67.2% of employees (209) out of 6 departments inview.
- **Average salary by position**: Among roles with at least 5 employees, Database Administrator pays most ($108,500) and Production Technician I least ($55,524).
- **Hiring vs termination trend**: Hiring peaked in 2011 (83 hires); terminations peaked in 2015(23). Net change over the period: +207.
- **Performance distribution**: 90.0% are rated Fully Meets or Exceeds; 31 employees (10.0%) areon Needs Improvement or PIP.
- **Termination reasons**: "Another position" is the leading exit reason (20 of 104 exits, 19.2%).
- **Recruitment source**: Indeed brings in the most hires (87). Retention ranges from 92.3% (Website) to 38.8% (Google Search).

**Key findings**

1. Highest-paying department: IT/IS (avg $97,065, company avg $69,021).
2. Highest attrition: Production at 39.7% vs 33.4% overall (83 of 209 employees left).
3. Most absences by role: IT Support (12.4 days avg vs 10.2 overall).
4. Best-retaining recruitment source: Website (92.3% still employed, n=13); weakest: Google Search (38.8%).
5. Leavers scored 4.09/5 on engagement vs 4.12/5 for current staff.

**Recommendations**

1. Prioritise retention in Production: its attrition (39.7%) is 6.3 points above the company rate. Start exit and stay interviews there first.
2. Shift recruiting effort toward Website (92.3% retention) and review spend on Google Search (38.8%).
3. The top voluntary exit reason is "Another position" (20 of 88 voluntary exits): run stay interviews and benchmark pay/career paths, since leavers are taking other jobs.

**Insights**

- *Compensation*: Database Administrator is the best-paid role (avg $108,500, 5 staff), 2.0x thelowest-paid role, Production Technician I ($55,524).
- *Attrition*: Production has the highest attrition: 39.7% (83 of 209) vs 33.4% overall.
- *Recruitment*: Website hires retain best (92.3% still active, n=13); Google Search retains worst (38.8%, n=49).
- *Exits*: Top exit reason is "Another position" (20 exits, 19.2% of 104); 84.6% of all exits were voluntary.
- *Performance*: Employees rated Exceeds earn $77,145 on average vs $64,450 for Needs Improvement/PIP (difference +$12,695).
- *Engagement*: Average engagement is 4.12/5 for active staff vs 4.09/5 for those who left (difference +0.03).
- *Absences*: IT Support has the most absences (12.4 days avg) vs 10.2 company-wide.
- *Pay equity*: Average salary: men $70,629 vs women $67,787 (+4.2% for men; not adjusted for role). -->

The report covers:

- **What each chart shows:** the largest roles and departments, the pay range across roles, hiring and termination peaks, the performance mix, the leading exit reason, and retention by recruitment source.
- **Key findings:** the highest-paying department, the highest-attrition department vs the company rate, the role with the most absences, the best- and worst-retaining recruitment sources, and engagement of leavers vs current staff.
- **Recommendations:** each one is chosen by the numbers. For example, focus retention work on the department with attrition furthest above average, move recruiting effort toward the source with the best retention, and target the top voluntary exit reason with a matching action.
