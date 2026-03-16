# Browser Automation

Automate web interactions for sites without APIs.

**When to use this vs CLI-Anything:** Use browser-automation for *web sites* that require
scraping, form filling, or authenticated sessions. Use CLI-Anything for *desktop software*
(image editors, office suites, video editors) that has source code but no API. CLI-Anything
produces deterministic, structured CLIs. Browser automation is for when you genuinely need
a browser.

## What It Does
- Navigate and scrape websites using Playwright
- Fill forms, click buttons, handle pagination
- Extract structured data from web pages
- Screenshot capture for visual verification
- Handle login flows and authenticated sessions

## Use Cases
- Scrape SEAK registry for physician contacts
- Monitor competitor websites for changes
- Extract data from legal directories
- Automated LinkedIn actions (with rate limiting)

## Inputs
- Target URL
- Action type (scrape, fill form, monitor)
- Data extraction rules
- Authentication credentials (from .env)

## Outputs
- Extracted data as JSON
- Screenshots
- Action logs

## Dependencies
- playwright (pip install playwright)
- playwright install chromium

## Source
Adapted from ComposioHQ/awesome-claude-skills (Playwright integration)
