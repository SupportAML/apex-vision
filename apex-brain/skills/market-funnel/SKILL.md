# Market Funnel

Sales funnel analysis and optimization. Maps conversion paths, identifies drop-off points, and recommends fixes.

## Usage
```
/market funnel <url>
/market funnel <url> --entity nlc
```

## Process

### Phase 1: Funnel Discovery and Mapping

Identify funnel type:
| Type | Entry → Exit |
|------|-------------|
| Lead Gen | Content → Form → Thank You |
| SaaS | Landing → Signup → Onboard → Activate |
| E-commerce | Product → Cart → Checkout → Confirm |
| Consultation | Content → Book Call → Consultation → Close |
| Membership | Sales Page → Join → Welcome → Engage |
| Freemium | Free Use → Upgrade Prompt → Payment |
| Webinar | Registration → Attend → Offer → Purchase |
| Content | Blog → Email Capture → Nurture → Convert |

Map the funnel visually:
```
AWARENESS          INTEREST           DECISION           ACTION
[Homepage]    →    [Services]    →    [Pricing]    →    [Contact/Buy]
   ↓                  ↓                  ↓                  ↓
[Blog/Social] →  [Case Studies] →  [Comparison]  →  [Free Trial]
```

### Phase 2: Page-by-Page Analysis

Score each funnel page on 5 dimensions (1-10):
1. **Clarity** — Is the next step obvious?
2. **Motivation** — Does it create desire to continue?
3. **Friction** — How many obstacles exist?
4. **Trust** — Are credibility signals present?
5. **Urgency** — Is there a reason to act now?

**Common Drop-off Points:**
- Homepage: No clear CTA, too many choices, slow load
- Services/Product: Missing pricing, weak differentiation, no social proof
- Pricing: Sticker shock, no value anchoring, too many tiers
- Signup/Cart: Too many form fields, no trust badges, surprise fees
- Checkout: No guest option, limited payment methods, unclear shipping

### Phase 3: Funnel Metrics and Benchmarks

**Revenue Per Visitor (RPV) Calculation:**
```
RPV = Conversion Rate × Average Order Value
```

**Benchmarks by Funnel Type:**
| Metric | Lead Gen | SaaS | E-commerce | Consultation |
|--------|----------|------|------------|--------------|
| Landing → Lead | 2-5% | 3-7% | N/A | 2-4% |
| Lead → Qualified | 20-30% | 15-25% | N/A | 30-50% |
| Qualified → Close | 10-20% | 5-15% | N/A | 20-40% |
| Cart → Purchase | N/A | N/A | 65-75% | N/A |

### Phase 4: Optimization Recommendations

**Priority Matrix:**
| Priority | Impact | Effort | Timeline |
|----------|--------|--------|----------|
| Critical | High | Low | This week |
| High | High | Medium | This month |
| Medium | Medium | Medium | This quarter |
| Low | Low | High | Backlog |
| Monitor | Unknown | Low | Ongoing |

**Funnel-Stage Optimizations:**
- **Top of funnel:** Traffic quality, messaging match, first impression
- **Middle of funnel:** Content depth, objection handling, social proof placement
- **Bottom of funnel:** CTA clarity, form optimization, trust signals, urgency
- **Post-conversion:** Onboarding, activation, retention hooks

### Phase 5: Nurture Sequence Integration
- Map email touchpoints to funnel stages
- Identify re-engagement opportunities for drop-offs
- Suggest retargeting strategies per stage

## Output
Save to `outputs/[entity]/marketing/FUNNEL-ANALYSIS.md`

## Apex Vision Integration
- Cross-reference with entity goals for conversion targets
- Feed findings into email-outreach skill for nurture sequences
- Connect with google-ads skill for retargeting recommendations

## Source
Adapted from zubair-trabzada/ai-marketing-claude (market-funnel) for Apex Vision
