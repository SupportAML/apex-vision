#!/usr/bin/env python3
"""Analyze a web page for marketing elements.

Usage:
    python analyze_page.py <url>

Extracts: title, meta description, headings, CTAs, forms, social links,
tracking scripts, schema markup, and content structure.

No external dependencies required (uses stdlib only).
"""

import json
import re
import sys
import urllib.request
import urllib.error
from html.parser import HTMLParser


class PageAnalyzer(HTMLParser):
    """Parse HTML and extract marketing-relevant elements."""

    def __init__(self):
        super().__init__()
        self.title = ""
        self.meta_description = ""
        self.meta_keywords = ""
        self.og_tags = {}
        self.headings = {"h1": [], "h2": [], "h3": []}
        self.links = []
        self.images = {"total": 0, "with_alt": 0, "without_alt": 0}
        self.forms = []
        self.ctas = []
        self.tracking = []
        self.schema_data = []
        self.social_links = []
        self.canonical = ""
        self.robots = ""

        # Parser state
        self._current_tag = ""
        self._current_attrs = {}
        self._capture_text = False
        self._text_buffer = ""
        self._in_form = False
        self._current_form = {"fields": [], "action": "", "method": ""}

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        self._current_tag = tag
        self._current_attrs = attrs_dict

        if tag == "title":
            self._capture_text = True
            self._text_buffer = ""

        elif tag == "meta":
            name = attrs_dict.get("name", "").lower()
            prop = attrs_dict.get("property", "").lower()
            content = attrs_dict.get("content", "")

            if name == "description":
                self.meta_description = content
            elif name == "keywords":
                self.meta_keywords = content
            elif name == "robots":
                self.robots = content
            elif prop.startswith("og:"):
                self.og_tags[prop] = content

        elif tag == "link":
            rel = attrs_dict.get("rel", "")
            if rel == "canonical":
                self.canonical = attrs_dict.get("href", "")

        elif tag in ("h1", "h2", "h3"):
            self._capture_text = True
            self._text_buffer = ""

        elif tag == "a":
            href = attrs_dict.get("href", "")
            self.links.append(href)
            # Detect social links
            social_platforms = ["facebook", "twitter", "linkedin", "instagram",
                              "youtube", "tiktok", "pinterest", "x.com"]
            for platform in social_platforms:
                if platform in href.lower():
                    self.social_links.append({"platform": platform, "url": href})
            # Detect CTA buttons/links
            classes = attrs_dict.get("class", "").lower()
            text = ""
            if any(kw in classes for kw in ["btn", "button", "cta", "action"]):
                self._capture_text = True
                self._text_buffer = ""

        elif tag == "img":
            self.images["total"] += 1
            if attrs_dict.get("alt"):
                self.images["with_alt"] += 1
            else:
                self.images["without_alt"] += 1

        elif tag == "form":
            self._in_form = True
            self._current_form = {
                "action": attrs_dict.get("action", ""),
                "method": attrs_dict.get("method", "GET"),
                "fields": [],
            }

        elif tag == "input" and self._in_form:
            self._current_form["fields"].append({
                "type": attrs_dict.get("type", "text"),
                "name": attrs_dict.get("name", ""),
                "required": "required" in attrs_dict,
            })

        elif tag == "script":
            src = attrs_dict.get("src", "")
            if src:
                tracking_patterns = {
                    "google-analytics": "Google Analytics",
                    "googletagmanager": "Google Tag Manager",
                    "gtag": "Google Analytics (gtag)",
                    "fbevents": "Facebook Pixel",
                    "facebook.net": "Facebook SDK",
                    "linkedin": "LinkedIn Insight",
                    "hotjar": "Hotjar",
                    "mixpanel": "Mixpanel",
                    "segment": "Segment",
                    "hubspot": "HubSpot",
                    "intercom": "Intercom",
                    "drift": "Drift",
                    "crisp": "Crisp",
                    "tiktok": "TikTok Pixel",
                }
                for pattern, name in tracking_patterns.items():
                    if pattern in src.lower():
                        self.tracking.append({"name": name, "src": src})

            # Check for JSON-LD schema
            if attrs_dict.get("type") == "application/ld+json":
                self._capture_text = True
                self._text_buffer = ""

    def handle_data(self, data):
        if self._capture_text:
            self._text_buffer += data.strip()

    def handle_endtag(self, tag):
        if self._capture_text:
            text = self._text_buffer.strip()

            if tag == "title":
                self.title = text
            elif tag in ("h1", "h2", "h3"):
                if text:
                    self.headings[tag].append(text)
            elif tag == "a":
                if text:
                    cta_words = ["get started", "sign up", "buy", "subscribe",
                                "contact", "book", "schedule", "try", "start",
                                "download", "learn more", "request", "call"]
                    if any(w in text.lower() for w in cta_words):
                        self.ctas.append(text)
            elif tag == "script" and self._current_attrs.get("type") == "application/ld+json":
                try:
                    self.schema_data.append(json.loads(text))
                except json.JSONDecodeError:
                    pass

            self._capture_text = False
            self._text_buffer = ""

        if tag == "form" and self._in_form:
            self._in_form = False
            self.forms.append(self._current_form)

    def get_results(self):
        return {
            "title": self.title,
            "title_length": len(self.title),
            "meta_description": self.meta_description,
            "meta_description_length": len(self.meta_description),
            "canonical": self.canonical,
            "robots": self.robots,
            "og_tags": self.og_tags,
            "headings": {
                "h1_count": len(self.headings["h1"]),
                "h1_text": self.headings["h1"],
                "h2_count": len(self.headings["h2"]),
                "h2_text": self.headings["h2"],
                "h3_count": len(self.headings["h3"]),
            },
            "images": self.images,
            "links_count": len(self.links),
            "ctas_found": self.ctas,
            "forms": self.forms,
            "tracking_scripts": self.tracking,
            "schema_data": self.schema_data,
            "social_links": self.social_links,
        }


def fetch_page(url):
    """Fetch a web page and return its HTML content."""
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
        print(f"Error fetching {url}: {e}")
        sys.exit(1)


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_page.py <url>")
        sys.exit(1)

    url = sys.argv[1]
    html = fetch_page(url)

    analyzer = PageAnalyzer()
    analyzer.feed(html)
    results = analyzer.get_results()
    results["url"] = url
    results["html_length"] = len(html)

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
