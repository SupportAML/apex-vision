# Market Report PDF

Generate a professional PDF marketing report from audit data using ReportLab.

## Usage
```
/market report-pdf <url>
/market report-pdf --from-audit outputs/nlc/marketing/MARKETING-AUDIT.md
```

## Prerequisites
```bash
pip install reportlab
```

## Process

### Step 1: Collect Report Data
If a MARKETING-AUDIT.md exists for this entity, parse it. Otherwise, run `/market audit` first.

### Step 2: Build JSON Data File
Create a JSON file with this structure for the PDF generator:

```json
{
  "business_name": "Business Name",
  "url": "https://example.com",
  "date": "2026-03-18",
  "overall_score": 72,
  "overall_grade": "B",
  "scores": {
    "content": {"score": 75, "grade": "B", "summary": "Strong headlines, weak CTAs"},
    "conversion": {"score": 65, "grade": "C", "summary": "Missing social proof"},
    "seo": {"score": 80, "grade": "A", "summary": "Good structure, needs schema"},
    "competitive": {"score": 70, "grade": "B", "summary": "Unique positioning unclear"},
    "brand": {"score": 68, "grade": "C", "summary": "Inconsistent voice across pages"},
    "strategy": {"score": 72, "grade": "B", "summary": "Good channels, needs retention focus"}
  },
  "findings": [
    {"title": "Finding title", "severity": "Critical", "description": "Details...", "recommendation": "Fix by..."},
  ],
  "action_plan": {
    "quick_wins": ["Item 1", "Item 2"],
    "strategic": ["Item 1", "Item 2"],
    "long_term": ["Item 1", "Item 2"]
  },
  "competitors": [
    {"name": "Competitor 1", "url": "https://...", "strengths": "...", "weaknesses": "..."}
  ]
}
```

### Step 3: Generate PDF
```bash
python scripts/marketing/generate_pdf_report.py report-data.json output.pdf
```

### PDF Contents
1. **Cover Page** — Business name, URL, overall score with color-coded gauge, date
2. **Score Breakdown** — Bar chart of 6 categories with color coding (green/yellow/red)
3. **Key Findings** — Top 10 findings with severity badges
4. **Action Plan** — Prioritized recommendations in 3 tiers
5. **Competitive Landscape** — Comparison table
6. **Methodology** — Scoring explanation for credibility

### Color Scheme
- Score 80-100: Green (#2ecc71)
- Score 60-79: Yellow (#f39c12)
- Score 0-59: Red (#e74c3c)
- Headers: Dark blue (#2c3e50)
- Body: Dark gray (#333333)

## Output
Save PDF to `outputs/[entity]/marketing/MARKETING-REPORT.pdf`

## Troubleshooting
- "No module named reportlab": Run `pip install reportlab`
- Fonts not found: ReportLab uses built-in Helvetica by default
- Large file size: Images and charts increase size; typical report is 2-5 pages

## Source
Adapted from zubair-trabzada/ai-marketing-claude (market-report-pdf) for Apex Vision
