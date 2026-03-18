# Google Ads & Multi-Platform Ads

Create and optimize ad campaigns across Google, Meta, LinkedIn, TikTok, and Twitter.
Also serves as the handler for `/market ads`.

## What It Does
- Generate ad copy (headlines, descriptions) per entity brand
- Keyword research and grouping
- Campaign structure recommendations
- Landing page suggestions
- Budget allocation advice
- Multi-platform ad creative generation
- Retargeting funnel design

## Inputs
- Entity name
- Campaign goal (leads, awareness, traffic)
- Target audience
- Budget range
- Competitor ads (optional)

## Outputs
- Ad copy variations per platform
- Keyword lists with match types
- Campaign structure document
- Saved to outputs/[entity]/ads/

## Multi-Platform Ad Framework (`/market ads`)

### Google Ads
- **Search:** 15 headlines (30 chars), 4 descriptions (90 chars), keyword groups
- **Display:** Image sizes, copy variations, audience targeting
- **YouTube:** Script (15s, 30s, 60s), thumbnail, CTA overlay

### Meta (Facebook + Instagram)
- **Feed:** Primary text (125 chars visible), headline, description, image specs
- **Stories:** 15-second vertical format, swipe-up CTA
- **Reels:** 30-60 second script with hook in first 3 seconds

### LinkedIn
- **Sponsored Content:** 150 char intro, 70 char headline, image
- **InMail:** Subject (60 chars), body (1,000 chars), CTA button
- **Lead Gen Forms:** Pre-filled fields, thank you message

### TikTok
- **In-Feed:** 9:16 video script, trending sound suggestions, 1 CTA
- **Spark Ads:** Boost top organic posts, native feel

### Retargeting Funnel
| Stage | Audience | Ad Type | Goal |
|-------|----------|---------|------|
| 1 | Cold | Educational content | Awareness |
| 2 | Warm (site visitors) | Social proof / case study | Consideration |
| 3 | Hot (cart/form abandon) | Direct offer + urgency | Conversion |
| 4 | Customer | Upsell / referral | Retention |

### Budget Allocation by Platform
| Budget Range | Google | Meta | LinkedIn | Other |
|-------------|--------|------|----------|-------|
| $500-2K/mo | 60% | 30% | 0% | 10% |
| $2K-5K/mo | 40% | 35% | 15% | 10% |
| $5K-15K/mo | 35% | 30% | 20% | 15% |
| $15K+/mo | 30% | 25% | 25% | 20% |

### Ad Copy Formulas
- **PAS:** Pain → Agitate → Solution
- **AIDA:** Attention → Interest → Desire → Action
- **Before-After-Bridge:** Current state → Desired state → Your solution
- **4U:** Useful, Urgent, Unique, Ultra-specific

## Source
Adapted from alirezarezvani/claude-skills (marketing pod) + zubair-trabzada/ai-marketing-claude (market-ads)
