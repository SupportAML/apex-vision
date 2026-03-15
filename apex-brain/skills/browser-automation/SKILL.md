# Browser Automation

Automate web interactions for sites without APIs.

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
