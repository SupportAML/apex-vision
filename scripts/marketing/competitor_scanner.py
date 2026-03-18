#!/usr/bin/env python3
"""Scan competitor websites for marketing intelligence.

Usage:
    python competitor_scanner.py <url1> [url2] [url3] ...

Analyzes each competitor for: positioning, pricing signals, trust indicators,
content strategy, and technology stack.

No external dependencies required (uses stdlib only).
"""

import json
import re
import sys
import urllib.request
import urllib.error
from html.parser import HTMLParser


class CompetitorParser(HTMLParser):
    """Extract competitive intelligence from HTML."""

    def __init__(self):
        super().__init__()
        self.title = ""
        self.meta_description = ""
        self.headings = []
        self.pricing_signals = []
        self.trust_signals = []
        self.ctas = []
        self.social_links = []
        self.tech_stack = []

        self._current_tag = ""
        self._capture = False
        self._buffer = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        self._current_tag = tag

        if tag == "title":
            self._capture = True
            self._buffer = ""

        elif tag == "meta":
            name = attrs_dict.get("name", "").lower()
            content = attrs_dict.get("content", "")
            if name == "description":
                self.meta_description = content
            elif name == "generator":
                self.tech_stack.append({"type": "CMS", "value": content})

        elif tag in ("h1", "h2", "h3"):
            self._capture = True
            self._buffer = ""

        elif tag == "a":
            href = attrs_dict.get("href", "")
            social_map = {
                "facebook.com": "Facebook", "twitter.com": "Twitter",
                "x.com": "Twitter/X", "linkedin.com": "LinkedIn",
                "instagram.com": "Instagram", "youtube.com": "YouTube",
                "tiktok.com": "TikTok",
            }
            for domain, name in social_map.items():
                if domain in href:
                    self.social_links.append(name)

        elif tag == "script":
            src = attrs_dict.get("src", "")
            tech_map = {
                "jquery": "jQuery", "react": "React", "vue": "Vue.js",
                "angular": "Angular", "bootstrap": "Bootstrap",
                "stripe": "Stripe", "shopify": "Shopify",
                "wordpress": "WordPress", "squarespace": "Squarespace",
                "wix": "Wix", "webflow": "Webflow",
                "hubspot": "HubSpot", "intercom": "Intercom",
                "drift": "Drift", "zendesk": "Zendesk",
            }
            for pattern, name in tech_map.items():
                if pattern in src.lower():
                    self.tech_stack.append({"type": "Technology", "value": name})

    def handle_data(self, data):
        if self._capture:
            self._buffer += data.strip()

        text = data.strip().lower()
        # Detect pricing signals
        pricing_patterns = [
            r"\$\d+", r"\/month", r"\/year", r"per month", r"per year",
            r"free trial", r"free plan", r"starting at", r"pricing",
            r"enterprise", r"contact for pricing", r"custom quote",
        ]
        for pattern in pricing_patterns:
            if re.search(pattern, text):
                self.pricing_signals.append(data.strip()[:100])
                break

        # Detect trust signals
        trust_patterns = [
            r"trusted by", r"customers", r"clients", r"companies",
            r"years of experience", r"certified", r"award",
            r"guarantee", r"money.back", r"testimonial",
            r"case study", r"results", r"roi",
        ]
        for pattern in trust_patterns:
            if re.search(pattern, text):
                self.trust_signals.append(data.strip()[:100])
                break

    def handle_endtag(self, tag):
        if self._capture:
            text = self._buffer.strip()
            if tag == "title":
                self.title = text
            elif tag in ("h1", "h2", "h3") and text:
                self.headings.append({"level": tag, "text": text[:200]})
            self._capture = False
            self._buffer = ""

    def get_results(self):
        return {
            "title": self.title,
            "meta_description": self.meta_description,
            "headings": self.headings[:20],
            "pricing_signals": list(set(self.pricing_signals))[:10],
            "trust_signals": list(set(self.trust_signals))[:10],
            "social_presence": list(set(self.social_links)),
            "tech_stack": self.tech_stack,
        }


def fetch_page(url):
    """Fetch a web page."""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; ApexVision/1.0; Marketing Audit)"
    }
    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            return response.read().decode(charset, errors="replace")
    except urllib.error.URLError as e:
        return None


def scan_competitor(url):
    """Scan a single competitor website."""
    html = fetch_page(url)
    if not html:
        return {"url": url, "error": "Could not fetch page"}

    parser = CompetitorParser()
    parser.feed(html)
    result = parser.get_results()
    result["url"] = url
    return result


def main():
    if len(sys.argv) < 2:
        print("Usage: python competitor_scanner.py <url1> [url2] [url3] ...")
        sys.exit(1)

    urls = sys.argv[1:]
    results = []

    for url in urls:
        print(f"Scanning: {url}...", file=sys.stderr)
        result = scan_competitor(url)
        results.append(result)

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
