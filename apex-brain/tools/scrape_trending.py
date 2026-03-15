#!/usr/bin/env python3
"""Scrape GitHub Trending and Trendshift for trending repos."""

import argparse
import json
import re
import sys
import urllib.request
import urllib.error


def scrape_github_trending(language: str = "", since: str = "daily") -> list:
    """Parse GitHub Trending page (no API needed)."""
    url = f"https://github.com/trending/{language}?since={since}"
    req = urllib.request.Request(url, headers={"User-Agent": "ApexBrain/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode()
    except urllib.error.URLError as e:
        return [{"status": "error", "message": str(e)}]

    repos = []
    # Match repo links: /owner/repo pattern inside article tags
    for match in re.finditer(r'<h2 class="h3[^"]*">\s*<a href="(/[^"]+)"', html):
        path = match.group(1).strip()
        parts = path.strip("/").split("/")
        if len(parts) == 2:
            repos.append({"owner": parts[0], "name": parts[1], "url": f"https://github.com{path}"})

    # Extract stars today
    star_matches = re.findall(r'(\d[\d,]*)\s+stars\s+today', html)
    for i, stars in enumerate(star_matches):
        if i < len(repos):
            repos[i]["stars_today"] = int(stars.replace(",", ""))

    return repos[:25]


def scrape_trendshift() -> list:
    """Fetch from Trendshift API."""
    url = "https://trendshift.io/api/repositories?language=&since=daily"
    req = urllib.request.Request(url, headers={"User-Agent": "ApexBrain/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
        return [{"name": r.get("name"), "owner": r.get("owner"), "stars": r.get("stars"), "description": r.get("description", "")} for r in data[:25]]
    except (urllib.error.URLError, json.JSONDecodeError) as e:
        return [{"status": "error", "source": "trendshift", "message": str(e)}]


def main():
    parser = argparse.ArgumentParser(description="Scrape trending repos")
    parser.add_argument("--source", choices=["github", "trendshift", "all"], default="all")
    parser.add_argument("--language", default="", help="Filter by language (GitHub only)")
    parser.add_argument("--since", default="daily", choices=["daily", "weekly", "monthly"])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.dry_run:
        print(json.dumps({"status": "dry_run", "source": args.source, "language": args.language}))
        return

    results = {}
    if args.source in ("github", "all"):
        results["github_trending"] = scrape_github_trending(args.language, args.since)
    if args.source in ("trendshift", "all"):
        results["trendshift"] = scrape_trendshift()

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
