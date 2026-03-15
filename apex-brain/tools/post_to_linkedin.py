#!/usr/bin/env python3
"""Post content to LinkedIn via API v2."""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error

API_BASE = "https://api.linkedin.com/v2"


def get_profile_id(token: str) -> str:
    req = urllib.request.Request(f"{API_BASE}/me", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    return data["id"]


def post(token: str, text: str, dry_run: bool = False) -> dict:
    profile_id = get_profile_id(token)
    payload = {
        "author": f"urn:li:person:{profile_id}",
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {"text": text},
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"},
    }

    if dry_run:
        return {"status": "dry_run", "would_post": payload}

    body = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{API_BASE}/ugcPosts",
        data=body,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return {"status": "posted", "response": json.loads(resp.read())}
    except urllib.error.HTTPError as e:
        return {"status": "error", "code": e.code, "message": e.read().decode()}


def main():
    parser = argparse.ArgumentParser(description="Post to LinkedIn")
    parser.add_argument("--text", required=True, help="Post content")
    parser.add_argument("--dry-run", action="store_true", help="Show payload without posting")
    args = parser.parse_args()

    token = os.environ.get("LINKEDIN_ACCESS_TOKEN")
    if not token:
        print(json.dumps({"status": "error", "message": "LINKEDIN_ACCESS_TOKEN not set"}))
        sys.exit(1)

    result = post(token, args.text, args.dry_run)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
