"""Print the full-dataset analysis as Markdown (paste the output into README.md).

Usage:  python generate_report.py
"""
import analytics
from data_loader import load_and_clean

df, report = load_and_clean()
s = analytics.summary(df)
a = analytics.analysis(df)

print(f"Dataset: {report['source_file']}, {report['raw_rows']} raw rows -> {report['rows_after_cleaning']} after cleaning "
      f"({report['duplicates_removed']} duplicates removed).\n")
print(f"- Employees: {s['total_employees']} ({s['active_employees']} active, {s['terminated_employees']} terminated)")
print(f"- Attrition rate: {s['attrition_rate']}%")
print(f"- Average salary: ${s['avg_salary']:,.0f}; annual payroll (active): ${s['total_payroll']:,.0f}")
print(f"- Average absences: {s['avg_absences']}; engagement {s['avg_engagement']}/5; satisfaction {s['avg_satisfaction']}/5\n")
print("**What each chart shows**\n")
for n in a["chart_notes"]:
    print(f"- **{n['chart']}**: {n['text']}")
print("\n**Key findings**\n")
for i, f in enumerate(a["findings"], 1):
    print(f"{i}. {f}")
print("\n**Recommendations**\n")
for i, r in enumerate(a["recommendations"], 1):
    print(f"{i}. {r}")
print("\n**Insights**\n")
for ins in analytics.insights(df):
    print(f"- *{ins['category']}*: {ins['text']}")
