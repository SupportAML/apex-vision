#!/usr/bin/env python3
"""Playwright browser automation template for sites without APIs."""

import argparse
import json
import sys

try:
    from playwright.sync_api import sync_playwright
    HAS_PLAYWRIGHT = True
except ImportError:
    HAS_PLAYWRIGHT = False


def run_script(url: str, script: str = "screenshot", output_path: str = "output.png", dry_run: bool = False) -> dict:
    if dry_run:
        return {"status": "dry_run", "url": url, "script": script, "output": output_path}

    if not HAS_PLAYWRIGHT:
        return {"status": "error", "message": "playwright not installed. Run: pip install playwright && playwright install chromium"}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle", timeout=30000)

        result = {}
        if script == "screenshot":
            page.screenshot(path=output_path, full_page=True)
            result = {"status": "ok", "type": "screenshot", "path": output_path}
        elif script == "extract_text":
            text = page.inner_text("body")
            result = {"status": "ok", "type": "text", "length": len(text), "preview": text[:500]}
        elif script == "extract_links":
            links = page.eval_on_selector_all("a[href]", "els => els.map(e => ({text: e.textContent.trim(), href: e.href}))")
            result = {"status": "ok", "type": "links", "count": len(links), "links": links[:50]}
        else:
            result = {"status": "error", "message": f"Unknown script: {script}"}

        browser.close()
    return result


def main():
    parser = argparse.ArgumentParser(description="Browser automation agent")
    parser.add_argument("--url", required=True, help="URL to navigate to")
    parser.add_argument("--script", default="screenshot", choices=["screenshot", "extract_text", "extract_links"])
    parser.add_argument("--output", default="output.png", help="Output file path (for screenshots)")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    result = run_script(args.url, args.script, args.output, args.dry_run)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
