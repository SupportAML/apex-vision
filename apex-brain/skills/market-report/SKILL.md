# Market Report

Generate a comprehensive marketing report in Markdown format with 6-category scorecard and 30-60-90 day roadmap.

## Usage
```
/market report <url>
/market report <url> --entity nlc
```

## Process

### Step 1: Data Collection
- Run full audit if not already done (check for existing `MARKETING-AUDIT.md`)
- Compile all findings from sub-analyses
- Gather competitor data

### Step 2: Report Structure

```markdown
# Marketing Report: [Business Name]
**Prepared by:** Apex Vision
**Date:** [date]
**URL:** [url]

---

## Executive Summary
[2-3 paragraph overview: current state, key opportunities, projected impact]

## Overall Score: [X]/100 — [Grade]

## Category Scores
| Category | Score | Grade | Key Finding |
|----------|-------|-------|-------------|
| Content & Messaging | X/100 | X | [one-liner] |
| Conversion Optimization | X/100 | X | [one-liner] |
| SEO & Discoverability | X/100 | X | [one-liner] |
| Competitive Positioning | X/100 | X | [one-liner] |
| Brand & Trust | X/100 | X | [one-liner] |
| Growth & Strategy | X/100 | X | [one-liner] |

## Detailed Findings

### Content & Messaging
[Analysis with specific examples from the site]

### Conversion Optimization
[Analysis with specific friction points identified]

### SEO & Discoverability
[Technical and content SEO findings]

### Competitive Positioning
[Market position relative to competitors]

### Brand & Trust
[Trust signals, consistency, credibility]

### Growth & Strategy
[Growth channels, retention, expansion opportunities]

## 30-60-90 Day Roadmap

### Days 1-30: Quick Wins
| Action | Impact | Effort | Owner |
|--------|--------|--------|-------|
| [action] | [expected result] | [hours] | [role] |

### Days 31-60: Strategic Changes
| Action | Impact | Effort | Owner |
|--------|--------|--------|-------|
| [action] | [expected result] | [days] | [role] |

### Days 61-90: Growth Investments
| Action | Impact | Effort | Owner |
|--------|--------|--------|-------|
| [action] | [expected result] | [weeks] | [role] |

## Competitor Landscape
[Comparison table with 3-5 competitors]

## Methodology
[Brief explanation of scoring approach and data sources]
```

## Output
Save to `outputs/[entity]/marketing/MARKETING-REPORT.md`

## Source
Adapted from zubair-trabzada/ai-marketing-claude (market-report) for Apex Vision
