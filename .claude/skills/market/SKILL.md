# Market — AI Marketing Suite

One command to access the full marketing toolkit. Routes to specialized sub-skills for every marketing deliverable.

## Commands

| Command | What It Does |
|---------|-------------|
| `/market audit <url>` | Full marketing audit with 5 parallel agents |
| `/market quick <url>` | 60-second marketing snapshot |
| `/market copy <url>` | Optimized copy with before/after examples |
| `/market emails <url>` | Complete email sequences (welcome, nurture, launch, cold) |
| `/market social <url>` | 30-day social media content calendar |
| `/market ads <url>` | Ad creative for Google, Meta, LinkedIn, TikTok |
| `/market funnel <url>` | Sales funnel analysis and optimization |
| `/market competitors <url>` | Competitive intelligence report |
| `/market landing <url>` | Landing page CRO analysis |
| `/market launch <product>` | Product/service launch playbook |
| `/market proposal <client>` | Client proposal with tiered pricing |
| `/market report <url>` | Full marketing report in Markdown |
| `/market report-pdf <url>` | Professional marketing report in PDF |
| `/market seo <url>` | SEO content audit |
| `/market brand <url>` | Brand voice analysis and guidelines |

## Entity-Aware Mode

All commands support `--entity <name>` to load business context:
```
/market audit https://example.com --entity nlc
```

When an entity is specified:
1. Load `entities/[entity]/brand.md` for voice and tone
2. Load `entities/[entity]/goals.md` for strategic context
3. Save output to `outputs/[entity]/marketing/`
4. Cross-reference with `context/priorities.md` for alignment

When no entity is specified:
- Treat as external client analysis
- Save output to `outputs/_clients/[domain]/`

## Routing Logic

When the user types `/market <command>`, route to the appropriate sub-skill:

- `audit` → `apex-brain/skills/market-audit/SKILL.md`
- `quick` → Run a condensed version of audit (skip agents, quick scores)
- `copy` → Use enhanced `apex-brain/skills/social-media-content/SKILL.md` copy section
- `emails` → Use enhanced `apex-brain/skills/email-outreach/SKILL.md`
- `social` → Use `apex-brain/skills/social-media-content/SKILL.md`
- `ads` → Use `apex-brain/skills/google-ads/SKILL.md` (expanded to all platforms)
- `funnel` → `apex-brain/skills/market-funnel/SKILL.md`
- `competitors` → Use `apex-brain/skills/competitor-analysis/SKILL.md`
- `landing` → `apex-brain/skills/market-landing/SKILL.md`
- `launch` → `apex-brain/skills/market-launch/SKILL.md`
- `proposal` → `apex-brain/skills/market-proposal/SKILL.md`
- `report` → `apex-brain/skills/market-report/SKILL.md`
- `report-pdf` → `apex-brain/skills/market-report-pdf/SKILL.md`
- `seo` → Use `apex-brain/skills/seo-content/SKILL.md`
- `brand` → `apex-brain/skills/market-brand/SKILL.md`

## Quick Mode (/market quick)

60-second snapshot — no parallel agents, just a fast assessment:

1. Fetch homepage only
2. Score each of the 6 categories quickly (gut assessment, 0-100)
3. List top 3 issues and top 3 strengths
4. Output a 1-page summary

## Business Type Detection

Automatically detect and adapt analysis:
| Type | Signals |
|------|---------|
| SaaS | Pricing page, free trial, signup flow, feature comparison |
| E-commerce | Product listings, cart, checkout, reviews |
| Agency | Portfolio, case studies, "our team", service packages |
| Local Business | Address, hours, Google Maps, phone number |
| Professional Services | Credentials, certifications, consultation booking |
| Content/Media | Blog, articles, newsletter signup, content library |

## Scoring Methodology

All scores use the same 0-100 scale with weighted categories:
| Category | Weight | What's Scored |
|----------|--------|--------------|
| Content & Messaging | 25% | Headlines, copy quality, value prop clarity |
| Conversion Optimization | 20% | CTAs, forms, social proof, friction |
| SEO & Discoverability | 20% | Technical SEO, content optimization, schema |
| Competitive Positioning | 15% | Differentiation, market positioning, gaps |
| Brand & Trust | 10% | Consistency, credibility, trust signals |
| Growth & Strategy | 10% | Channels, retention, scalability |

## Output Standards

All outputs must:
- Use Markdown formatting with proper headers
- Include actionable recommendations (not just observations)
- Provide before/after examples where applicable
- Estimate impact for each recommendation
- Be client-ready (professional tone, no internal jargon)
- Save to the appropriate `outputs/` path

## How to Use This for Client Acquisition

1. Find a business with a weak website
2. Run `/market audit` on their URL
3. Run `/market report-pdf` to generate the PDF
4. Send the report for free — instant credibility
5. Run `/market proposal` to generate a follow-up proposal
6. Close on a retainer

## Source
Adapted from zubair-trabzada/ai-marketing-claude for Apex Vision multi-entity architecture
