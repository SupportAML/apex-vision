# Status Report

Generate a comprehensive portfolio-wide status report across all business entities.

## What It Does
- Pulls recent workflow run history from run_log.jsonl
- Loads each entity's config, goals, and latest outputs
- Checks goal progress (targets vs current trajectory)
- Surfaces pending approvals, failed runs, and blockers
- Summarizes automation health (what ran, what didn't, what broke)
- Highlights priority actions ranked by revenue impact

## Inputs
- Scope: "all" (default) or specific entity name
- Period: "daily" (last 24h), "weekly" (last 7 days), or "monthly"
- Format: "dashboard" (visual, default) or "detail" (full breakdown)

## Outputs
- Per-entity status cards: health indicator, key metrics, recent activity
- Portfolio summary: total runs, approval queue depth, success rate
- Goal tracker: Q2/Q3 targets vs current pace
- Action items: what needs attention right now, ranked by priority tier
- Saved to outputs/status-reports/

## Sections in Report
1. **Portfolio Pulse** - one-line health per entity (green/yellow/red)
2. **Automation Health** - runs in period, pass/fail rate, pending approvals
3. **Goal Tracker** - each entity's targets vs trajectory
4. **Revenue Pipeline** - NLC cases, A2Z capital, Club Haus launch status
5. **Content Pipeline** - posts generated, approved, published per entity
6. **Blockers & Action Items** - what's stuck, what needs you
7. **This Week's Wins** - completed milestones and highlights

## Source
Custom skill for Apex Brain portfolio management.
