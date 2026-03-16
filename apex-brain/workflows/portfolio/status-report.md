# Portfolio Status Report
schedule: daily

## Objective
Generate a daily portfolio-wide status report so Abhi can see everything at a glance: what ran, what broke, what needs approval, and where each entity stands against goals.

## Schedule
Daily, 7:30am EST (before the morning content run)

## Steps
1. **Collect Run Data** - Pull all workflow runs from run_log.jsonl for the reporting period
2. **Entity Health Check** - For each entity, assess: workflows defined, runs completed, failures, pending approvals, latest outputs
3. **Goal Progress** - Compare each entity's current activity against Q2/Q3 targets
4. **Revenue Pipeline** - Surface NLC case count trajectory, A2Z capital raised, Club Haus launch readiness
5. **Content Pipeline** - Count posts generated, approved, published across all entities
6. **Blockers & Actions** - Flag entities with no activity (red), failures or pending approvals (yellow)
7. **Compile Report** - Assemble into visual dashboard format and save to outputs/status-reports/

## Skills Used
- status-report

## Tools Used
- tools/generate_status_report.py

## Output
- Dashboard summary printed to console
- Full JSON report saved to outputs/status-reports/
- Can be sent via email to Abhi using tools/send_email.py
