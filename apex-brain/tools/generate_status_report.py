#!/usr/bin/env python3
"""Generate a portfolio-wide status report across all Apex Brain entities."""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ENTITIES_DIR = REPO_ROOT / "entities"
WORKFLOWS_DIR = REPO_ROOT / "workflows"
OUTPUTS_DIR = REPO_ROOT / "outputs"
CONTEXT_DIR = REPO_ROOT / "context"
RUN_LOG = REPO_ROOT / "decisions" / "run_log.jsonl"
REPORT_DIR = OUTPUTS_DIR / "status-reports"


def load_file(path: Path) -> str:
    try:
        return path.read_text().strip()
    except FileNotFoundError:
        return ""


def load_run_log(since: datetime) -> list:
    """Load run log entries since a given timestamp."""
    entries = []
    if not RUN_LOG.exists():
        return entries
    for line in RUN_LOG.read_text().strip().splitlines():
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
            ts = datetime.fromisoformat(entry.get("timestamp", ""))
            if ts >= since:
                entries.append(entry)
        except (json.JSONDecodeError, ValueError):
            continue
    return entries


def get_entities() -> list:
    """Discover all entity directories."""
    if not ENTITIES_DIR.exists():
        return []
    return sorted([d.name for d in ENTITIES_DIR.iterdir() if d.is_dir()])


def get_entity_config(entity: str) -> dict:
    """Load config, goals, and brand for an entity."""
    edir = ENTITIES_DIR / entity
    return {
        "name": entity,
        "config": load_file(edir / "config.md"),
        "goals": load_file(edir / "goals.md"),
        "brand": load_file(edir / "brand.md"),
        "reviewers": load_file(edir / "reviewers.md"),
    }


def get_entity_workflows(entity: str) -> list:
    """List workflows for an entity."""
    wdir = WORKFLOWS_DIR / entity
    if not wdir.exists():
        return []
    return [f.stem for f in wdir.glob("*.md")]


def get_latest_outputs(entity: str, limit: int = 5) -> list:
    """Get most recent output files for an entity."""
    odir = OUTPUTS_DIR / entity
    if not odir.exists():
        return []
    files = sorted(odir.glob("*.json"), key=lambda f: f.stat().st_mtime, reverse=True)
    results = []
    for f in files[:limit]:
        try:
            data = json.loads(f.read_text())
            results.append({
                "file": f.name,
                "workflow": data.get("workflow", f.stem),
                "timestamp": data.get("timestamp", ""),
                "steps_total": len(data.get("steps", [])),
                "steps_completed": sum(
                    1 for s in data.get("steps", []) if s.get("status") == "completed"
                ),
                "needs_approval": any(
                    s.get("needs_approval") for s in data.get("steps", [])
                ),
            })
        except (json.JSONDecodeError, OSError):
            continue
    return results


def compute_period(period: str) -> datetime:
    """Return the start datetime for a given period."""
    now = datetime.utcnow()
    if period == "daily":
        return now - timedelta(hours=24)
    elif period == "weekly":
        return now - timedelta(days=7)
    elif period == "monthly":
        return now - timedelta(days=30)
    return now - timedelta(days=7)


def build_entity_report(entity: str, run_entries: list) -> dict:
    """Build status report for a single entity."""
    config = get_entity_config(entity)
    workflows = get_entity_workflows(entity)
    outputs = get_latest_outputs(entity)
    entity_runs = [r for r in run_entries if r.get("entity") == entity]

    total_runs = len(entity_runs)
    completed_runs = sum(
        1 for r in entity_runs
        if r.get("steps_completed", 0) == r.get("steps_total", 0) and r.get("steps_total", 0) > 0
    )
    failed_runs = sum(
        1 for r in entity_runs
        if r.get("steps_completed", 0) < r.get("steps_total", 0) and r.get("steps_total", 0) > 0
    )
    pending_approvals = sum(1 for r in entity_runs if r.get("needs_approval"))

    # Health: green if all runs succeeded, yellow if some failed or pending, red if no runs
    if total_runs == 0:
        health = "red"
        health_label = "No activity"
    elif failed_runs > 0:
        health = "yellow"
        health_label = f"{failed_runs} failed run(s)"
    elif pending_approvals > 0:
        health = "yellow"
        health_label = f"{pending_approvals} awaiting approval"
    else:
        health = "green"
        health_label = "All systems go"

    return {
        "entity": entity,
        "health": health,
        "health_label": health_label,
        "workflows_defined": len(workflows),
        "workflow_names": workflows,
        "runs_in_period": total_runs,
        "runs_completed": completed_runs,
        "runs_failed": failed_runs,
        "pending_approvals": pending_approvals,
        "recent_outputs": outputs,
        "goals_summary": config["goals"][:500] if config["goals"] else "No goals defined",
        "has_config": bool(config["config"]),
        "has_brand": bool(config["brand"]),
        "has_reviewers": bool(config["reviewers"]),
    }


def build_portfolio_report(scope: str, period: str) -> dict:
    """Build the full portfolio status report."""
    since = compute_period(period)
    run_entries = load_run_log(since)
    entities = get_entities()

    if scope != "all":
        entities = [e for e in entities if e == scope]

    entity_reports = []
    for entity in entities:
        entity_reports.append(build_entity_report(entity, run_entries))

    # Portfolio-level aggregation
    total_runs = sum(e["runs_in_period"] for e in entity_reports)
    total_completed = sum(e["runs_completed"] for e in entity_reports)
    total_failed = sum(e["runs_failed"] for e in entity_reports)
    total_pending = sum(e["pending_approvals"] for e in entity_reports)
    active_entities = sum(1 for e in entity_reports if e["runs_in_period"] > 0)
    success_rate = round(total_completed / total_runs * 100, 1) if total_runs > 0 else 0

    # Load priorities for action items
    priorities = load_file(CONTEXT_DIR / "priorities.md")
    goals = load_file(CONTEXT_DIR / "goals.md")

    # Determine entities needing attention
    needs_attention = [
        e["entity"] for e in entity_reports if e["health"] in ("red", "yellow")
    ]

    report = {
        "report_type": "status_report",
        "generated_at": datetime.utcnow().isoformat(),
        "period": period,
        "scope": scope,
        "portfolio_summary": {
            "total_entities": len(entity_reports),
            "active_entities": active_entities,
            "total_runs": total_runs,
            "completed_runs": total_completed,
            "failed_runs": total_failed,
            "success_rate_pct": success_rate,
            "pending_approvals": total_pending,
            "entities_needing_attention": needs_attention,
        },
        "entities": entity_reports,
        "priorities": priorities[:1000] if priorities else "Not set",
        "goals": goals[:1000] if goals else "Not set",
    }

    return report


def format_dashboard(report: dict) -> str:
    """Format report as a visual dashboard string."""
    lines = []
    lines.append("=" * 60)
    lines.append("  APEX BRAIN STATUS REPORT")
    lines.append(f"  Generated: {report['generated_at'][:19]} UTC")
    lines.append(f"  Period: {report['period']} | Scope: {report['scope']}")
    lines.append("=" * 60)

    ps = report["portfolio_summary"]
    lines.append("")
    lines.append("PORTFOLIO PULSE")
    lines.append("-" * 40)
    lines.append(f"  Entities: {ps['active_entities']}/{ps['total_entities']} active")
    lines.append(f"  Workflow runs: {ps['total_runs']} ({ps['success_rate_pct']}% success)")
    lines.append(f"  Pending approvals: {ps['pending_approvals']}")
    if ps["entities_needing_attention"]:
        lines.append(f"  Needs attention: {', '.join(ps['entities_needing_attention'])}")

    lines.append("")
    lines.append("ENTITY STATUS")
    lines.append("-" * 40)

    health_icons = {"green": "[OK]", "yellow": "[!!]", "red": "[XX]"}

    for e in report["entities"]:
        icon = health_icons.get(e["health"], "[??]")
        lines.append(f"  {icon} {e['entity']}")
        lines.append(f"      {e['health_label']}")
        lines.append(f"      Workflows: {e['workflows_defined']} | Runs: {e['runs_in_period']} | Approvals pending: {e['pending_approvals']}")
        if e["recent_outputs"]:
            latest = e["recent_outputs"][0]
            lines.append(f"      Latest: {latest['workflow']} ({latest['timestamp'][:10]})")
        lines.append("")

    if report.get("goals"):
        lines.append("GOAL TRACKER")
        lines.append("-" * 40)
        for line in report["goals"].splitlines():
            if line.strip().startswith("-") or line.strip().startswith("#"):
                lines.append(f"  {line.strip()}")
        lines.append("")

    attention = ps.get("entities_needing_attention", [])
    if attention:
        lines.append("ACTION ITEMS")
        lines.append("-" * 40)
        for entity in attention:
            ereport = next(e for e in report["entities"] if e["entity"] == entity)
            if ereport["health"] == "red":
                lines.append(f"  [URGENT] {entity}: {ereport['health_label']} - needs workflow runs configured")
            else:
                lines.append(f"  [CHECK] {entity}: {ereport['health_label']}")
        lines.append("")

    lines.append("=" * 60)
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Generate Apex Brain status report")
    parser.add_argument("--scope", default="all", help="Entity name or 'all'")
    parser.add_argument("--period", choices=["daily", "weekly", "monthly"], default="weekly")
    parser.add_argument("--format", dest="fmt", choices=["dashboard", "detail", "json"], default="dashboard")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.dry_run:
        print(json.dumps({
            "status": "dry_run",
            "scope": args.scope,
            "period": args.period,
            "format": args.fmt,
        }))
        return

    report = build_portfolio_report(args.scope, args.period)

    # Save the JSON report
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    report_file = REPORT_DIR / f"status_{args.period}_{ts}.json"
    report_file.write_text(json.dumps(report, indent=2))

    if args.fmt == "json":
        print(json.dumps(report, indent=2))
    elif args.fmt == "detail":
        print(json.dumps(report, indent=2))
    else:
        print(format_dashboard(report))
        print(f"\nFull report saved: {report_file}")


if __name__ == "__main__":
    main()
