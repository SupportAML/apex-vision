#!/usr/bin/env python3
"""Fetch basic metrics from Google Analytics 4 and LinkedIn page analytics."""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timedelta


def fetch_ga4(property_id: str, token: str, days: int = 7) -> dict:
    """Pull pageviews and users from GA4 Data API."""
    end = datetime.utcnow().strftime("%Y-%m-%d")
    start = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
    payload = {
        "dateRanges": [{"startDate": start, "endDate": end}],
        "metrics": [
            {"name": "activeUsers"},
            {"name": "screenPageViews"},
            {"name": "sessions"},
            {"name": "bounceRate"},
        ],
    }
    url = f"https://analyticsdata.googleapis.com/v1beta/properties/{property_id}:runReport"
    body = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=body, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
        rows = data.get("rows", [])
        if rows:
            values = rows[0].get("metricValues", [])
            return {
                "source": "ga4",
                "period": f"{start} to {end}",
                "active_users": values[0]["value"] if len(values) > 0 else None,
                "pageviews": values[1]["value"] if len(values) > 1 else None,
                "sessions": values[2]["value"] if len(values) > 2 else None,
                "bounce_rate": values[3]["value"] if len(values) > 3 else None,
            }
        return {"source": "ga4", "period": f"{start} to {end}", "data": "no rows"}
    except urllib.error.HTTPError as e:
        return {"source": "ga4", "status": "error", "code": e.code, "message": e.read().decode()}


def fetch_linkedin(token: str) -> dict:
    """Pull LinkedIn organization page stats."""
    url = "https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req) as resp:
            return {"source": "linkedin", "data": json.loads(resp.read())}
    except urllib.error.HTTPError as e:
        return {"source": "linkedin", "status": "error", "code": e.code, "message": e.read().decode()}


def main():
    parser = argparse.ArgumentParser(description="Fetch analytics metrics")
    parser.add_argument("--source", choices=["ga4", "linkedin", "all"], default="all")
    parser.add_argument("--days", type=int, default=7, help="Lookback period for GA4")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be fetched")
    args = parser.parse_args()

    if args.dry_run:
        print(json.dumps({"status": "dry_run", "source": args.source, "days": args.days}))
        return

    results = []
    if args.source in ("ga4", "all"):
        ga_id = os.environ.get("GOOGLE_ANALYTICS_ID")
        ga_token = os.environ.get("GOOGLE_ANALYTICS_TOKEN")
        if ga_id and ga_token:
            results.append(fetch_ga4(ga_id, ga_token, args.days))
        else:
            results.append({"source": "ga4", "status": "skipped", "message": "GOOGLE_ANALYTICS_ID or GOOGLE_ANALYTICS_TOKEN not set"})

    if args.source in ("linkedin", "all"):
        li_token = os.environ.get("LINKEDIN_ACCESS_TOKEN")
        if li_token:
            results.append(fetch_linkedin(li_token))
        else:
            results.append({"source": "linkedin", "status": "skipped", "message": "LINKEDIN_ACCESS_TOKEN not set"})

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
