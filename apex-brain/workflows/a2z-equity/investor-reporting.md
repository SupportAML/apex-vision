# Investor Reporting - A2Z Equity

## Objective
Generate professional investor updates on portfolio performance and new opportunities.

## Schedule
Monthly (1st of month)

## Steps
1. **Gather** - Pull current valuations and news on portfolio companies
2. **Draft** - Create investor update email (portfolio summary, returns, news, upcoming opportunities)
3. **Format** - Clean, professional layout with charts and key numbers
4. **Review** - Queue for Abhi and Ovi approval
5. **Send** - Distribute to investor list via email

## Skills Used
- email-outreach
- cli-anything (for PDF report generation via LibreOffice if installed)

## Tools Used
- tools/send_email.py
- cli-anything-libreoffice (if on PATH, for Format step)

## Tool Preference
For the Format step: use `cli-anything-libreoffice` to generate professional PDF reports
with charts and formatting from templates. Produces real PDFs, not just markdown.

## Output
- Report saved to outputs/a2z-equity/reports/
