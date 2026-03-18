# Market Audit

Full marketing audit with 5 parallel subagents. Scores any website across 6 categories and produces a client-ready report.

## Usage
```
/market audit <url>
/market audit <url> --entity nlc
```

## How It Works

### Phase 1: Discovery
1. Fetch the target URL homepage and up to 5 key interior pages (about, pricing, services, contact, blog)
2. Detect business type: SaaS | E-commerce | Agency | Local Business | Professional Services | Content/Media
3. Map site architecture: navigation structure, page hierarchy, conversion paths

### Phase 2: Parallel Analysis (5 Subagents)

Launch ALL 5 agents simultaneously using the Agent tool:

| Agent | File | Focus |
|-------|------|-------|
| Content | `.agents/skills/marketing/content.md` | Headlines, copy, value prop, CTAs, content depth |
| Conversion | `.agents/skills/marketing/conversion.md` | CTA strategy, social proof, friction, trust, urgency |
| Competitive | `.agents/skills/marketing/competitive.md` | Competitor ID, positioning map, gaps, opportunities |
| Technical | `.agents/skills/marketing/technical.md` | Page structure, crawlability, performance, schema, tracking |
| Strategy | `.agents/skills/marketing/strategy.md` | Brand consistency, trust architecture, pricing, growth |

Each agent scores their domain 0-100 and returns structured findings.

### Phase 3: Synthesis

**Weighted Scoring:**
| Category | Weight |
|----------|--------|
| Content & Messaging | 25% |
| Conversion Optimization | 20% |
| SEO & Discoverability | 20% |
| Competitive Positioning | 15% |
| Brand & Trust | 10% |
| Growth & Strategy | 10% |

**Grade Scale:**
- 90-100: A+ (Exceptional)
- 80-89: A (Strong)
- 70-79: B (Good, room to improve)
- 60-69: C (Needs work)
- 50-59: D (Significant issues)
- Below 50: F (Major overhaul needed)

**Revenue Impact Estimates:**
For each recommendation, estimate potential revenue impact:
- Quick wins (< 1 week): Expected lift percentage
- Strategic changes (1-4 weeks): Expected conversion improvement
- Long-term investments (1-3 months): Expected growth trajectory

## Output

Save to `outputs/[entity]/marketing/MARKETING-AUDIT.md` with:

```markdown
# Marketing Audit: [Business Name]
**URL:** [url]
**Date:** [date]
**Overall Score:** [X]/100 ([Grade])

## Score Breakdown
| Category | Score | Grade | Weight |
|----------|-------|-------|--------|
| Content & Messaging | X/100 | X | 25% |
| Conversion Optimization | X/100 | X | 20% |
| SEO & Discoverability | X/100 | X | 20% |
| Competitive Positioning | X/100 | X | 15% |
| Brand & Trust | X/100 | X | 10% |
| Growth & Strategy | X/100 | X | 10% |

## Top 10 Findings
[Numbered list with severity: Critical / High / Medium / Low]

## Quick Wins (This Week)
[Actionable items with expected impact]

## Strategic Changes (This Month)
[Medium-term improvements]

## Long-Term Investments (This Quarter)
[Growth-oriented recommendations]

## Competitor Comparison
| Factor | [Business] | [Comp 1] | [Comp 2] | [Comp 3] |
|--------|-----------|----------|----------|----------|

## Methodology
[Brief explanation of scoring approach]
```

Also display a terminal summary with the score breakdown.

## Apex Vision Integration
- If `--entity` is provided, load brand.md and goals.md for context
- Cross-reference findings with entity priorities from `context/priorities.md`
- Flag opportunities that align with revenue generation goals
- When run for a client prospect, suggest which findings to highlight in a proposal

## Source
Adapted from zubair-trabzada/ai-marketing-claude (market-audit) for Apex Vision multi-entity architecture
