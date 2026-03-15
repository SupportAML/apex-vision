#!/usr/bin/env python3
"""Trigger a Vercel deployment via API."""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error


def deploy(token: str, project_id: str, target: str = "production", dry_run: bool = False) -> dict:
    if dry_run:
        return {"status": "dry_run", "project": project_id, "target": target}

    url = f"https://api.vercel.com/v13/deployments"
    payload = {"name": project_id, "target": target}
    body = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=body, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read())
        return {
            "status": "deployed",
            "id": data.get("id"),
            "url": data.get("url"),
            "target": target,
        }
    except urllib.error.HTTPError as e:
        return {"status": "error", "code": e.code, "message": e.read().decode()}


def main():
    parser = argparse.ArgumentParser(description="Trigger Vercel deployment")
    parser.add_argument("--target", default="production", choices=["production", "preview"])
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    token = os.environ.get("VERCEL_TOKEN")
    project_id = os.environ.get("VERCEL_PROJECT_ID")
    if not token or not project_id:
        print(json.dumps({"status": "error", "message": "VERCEL_TOKEN and VERCEL_PROJECT_ID required"}))
        sys.exit(1)

    result = deploy(token, project_id, args.target, args.dry_run)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
