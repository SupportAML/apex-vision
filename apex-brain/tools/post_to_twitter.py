#!/usr/bin/env python3
"""Post a tweet via Twitter API v2 using OAuth 1.0a."""

import argparse
import hashlib
import hmac
import json
import os
import sys
import time
import urllib.parse
import urllib.request
import urllib.error
import uuid

TWEET_URL = "https://api.twitter.com/2/tweets"


def oauth_signature(method: str, url: str, params: dict, consumer_secret: str, token_secret: str) -> str:
    base = "&".join([
        method.upper(),
        urllib.parse.quote(url, safe=""),
        urllib.parse.quote("&".join(f"{k}={urllib.parse.quote(str(v), safe='')}" for k, v in sorted(params.items())), safe=""),
    ])
    key = f"{urllib.parse.quote(consumer_secret, safe='')}&{urllib.parse.quote(token_secret, safe='')}"
    return hmac.new(key.encode(), base.encode(), hashlib.sha1).digest().hex()


def build_auth_header(consumer_key: str, consumer_secret: str, access_token: str, access_secret: str) -> str:
    oauth_params = {
        "oauth_consumer_key": consumer_key,
        "oauth_nonce": uuid.uuid4().hex,
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": access_token,
        "oauth_version": "1.0",
    }
    sig = oauth_signature("POST", TWEET_URL, oauth_params, consumer_secret, access_secret)
    oauth_params["oauth_signature"] = sig
    header = ", ".join(f'{k}="{urllib.parse.quote(str(v), safe="")}"' for k, v in sorted(oauth_params.items()))
    return f"OAuth {header}"


def tweet(text: str, dry_run: bool = False) -> dict:
    keys = {k: os.environ.get(k) for k in ["TWITTER_API_KEY", "TWITTER_API_SECRET", "TWITTER_ACCESS_TOKEN", "TWITTER_ACCESS_SECRET"]}
    missing = [k for k, v in keys.items() if not v]
    if missing:
        return {"status": "error", "message": f"Missing env vars: {', '.join(missing)}"}

    payload = {"text": text}
    if dry_run:
        return {"status": "dry_run", "would_post": payload}

    auth = build_auth_header(keys["TWITTER_API_KEY"], keys["TWITTER_API_SECRET"], keys["TWITTER_ACCESS_TOKEN"], keys["TWITTER_ACCESS_SECRET"])
    body = json.dumps(payload).encode()
    req = urllib.request.Request(TWEET_URL, data=body, headers={"Authorization": auth, "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return {"status": "posted", "response": json.loads(resp.read())}
    except urllib.error.HTTPError as e:
        return {"status": "error", "code": e.code, "message": e.read().decode()}


def main():
    parser = argparse.ArgumentParser(description="Post a tweet")
    parser.add_argument("--text", required=True, help="Tweet text (max 280 chars)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if len(args.text) > 280:
        print(json.dumps({"status": "error", "message": f"Tweet too long: {len(args.text)}/280"}))
        sys.exit(1)

    result = tweet(args.text, args.dry_run)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
