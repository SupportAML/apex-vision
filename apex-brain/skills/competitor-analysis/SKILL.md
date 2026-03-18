# Competitor Analysis

Research and analyze competitors for any entity.
Also serves as the handler for `/market competitors`.

## What It Does
- Identify top competitors by market segment
- Analyze their web presence, content strategy, pricing
- Track changes over time (new pages, content, offerings)
- Generate comparison matrices and SWOT analysis
- Identify gaps and opportunities
- Create alternative page strategy content

## Inputs
- Entity name
- Competitor names or URLs (optional, can discover)
- Focus areas (pricing, content, features, market position)

## Outputs
- Competitor profile per company
- Comparison matrix
- SWOT analysis
- Opportunity recommendations
- Saved to outputs/[entity]/research/

## Enhanced Analysis Framework (`/market competitors`)

### Step 1: Competitor Identification
- Direct competitors (same service, same market)
- Indirect competitors (different approach, same problem)
- Aspirational competitors (where you want to be)
- Use `scripts/marketing/competitor_scanner.py` to automate scanning:
```bash
python scripts/marketing/competitor_scanner.py url1 url2 url3
```

### Step 2: Analysis Dimensions
| Dimension | What to Analyze |
|-----------|----------------|
| Positioning | Tagline, hero messaging, unique claims |
| Pricing | Tiers, anchoring, free options, transparency |
| Content | Blog frequency, topics, quality, SEO rankings |
| Social | Platforms, follower count, engagement rate, posting frequency |
| Trust | Testimonials, case studies, certifications, awards |
| Technology | Tech stack, tools, integrations |
| Advertising | Ad spend signals, ad copy, landing pages |

### Step 3: SWOT Matrix
For each competitor:
| | Strengths | Weaknesses |
|---|-----------|------------|
| **Internal** | [list] | [list] |

| | Opportunities | Threats |
|---|--------------|---------|
| **External** | [list] | [list] |

### Step 4: Feature/Pricing Comparison
| Feature | You | Comp 1 | Comp 2 | Comp 3 |
|---------|-----|--------|--------|--------|
| [Feature 1] | Y/N | Y/N | Y/N | Y/N |
| [Feature 2] | Y/N | Y/N | Y/N | Y/N |
| **Price** | $X | $Y | $Z | $W |

### Step 5: Gap Analysis
- Content gaps: Topics competitors cover that you don't
- Feature gaps: Capabilities competitors offer
- Channel gaps: Platforms competitors use effectively
- Market gaps: Segments competitors aren't serving

### Step 6: Actionable Strategy
- "Beat them" plays (where you're close but behind)
- "Leapfrog" plays (where you can skip ahead)
- "Ignore" plays (where competing isn't worth it)
- Alternative page strategy: Create "[Competitor] Alternative" content

## Source
Adapted from alirezarezvani/claude-skills (business growth pod) + VoltAgent/awesome-agent-skills (Firecrawl) + zubair-trabzada/ai-marketing-claude (market-competitors)
