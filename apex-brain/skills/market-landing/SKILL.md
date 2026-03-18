# Market Landing

Landing page CRO (Conversion Rate Optimization) analysis. Scores pages against a 7-point framework and generates A/B test hypotheses.

## Usage
```
/market landing <url>
/market landing <url> --entity nlc
```

## Process

### Step 1: Identify Page Type
Detect and apply appropriate conversion benchmarks:
| Page Type | Good CVR | Great CVR | Elite CVR |
|-----------|----------|-----------|-----------|
| Lead Gen | 5-10% | 10-20% | 20%+ |
| SaaS Trial | 3-7% | 7-15% | 15%+ |
| E-commerce Product | 2-4% | 4-8% | 8%+ |
| Webinar Registration | 20-30% | 30-50% | 50%+ |
| Free Tool/Resource | 15-25% | 25-40% | 40%+ |
| Consultation Booking | 5-10% | 10-20% | 20%+ |

### Step 2: 7-Point CRO Framework

Score each section (0-100) with its weight:

**1. Hero Section (25%)**
- Headline clarity and benefit focus
- Subheadline supporting detail
- Hero image/video relevance
- Primary CTA visibility (above fold)
- Does it pass the 5-second test?

**2. Value Proposition (20%)**
- Unique mechanism or differentiator
- Specificity (numbers, timeframes, outcomes)
- Problem-solution alignment
- Comparison to alternatives

**3. Social Proof (15%)**
- Testimonials with photos and full names
- Case studies with measurable results
- Trust badges (logos, certifications, awards)
- User/customer count or metrics
- Star ratings and review integration

**4. Features/Benefits (15%)**
- Benefits over features ratio
- Visual hierarchy and scannability
- Outcome-focused language
- Supporting visuals/icons

**5. Objection Handling (10%)**
- FAQ section addressing top concerns
- Risk reversal (guarantees, free trials)
- Comparison tables
- "Who this is for / not for" section

**6. CTA Strategy (10%)**
- Primary CTA clarity and contrast
- CTA copy (action-oriented vs generic)
- Number of CTAs (not too many, not too few)
- Micro-commitments leading to main CTA
- Mobile tap target size

**7. Footer/Close (5%)**
- Final CTA placement
- Contact information and trust signals
- Legal/privacy links
- Secondary navigation

### Step 3: Copy Scoring (5 Dimensions)
Rate each 1-10:
1. **Clarity** — Can a 12-year-old understand the offer?
2. **Specificity** — Numbers, timeframes, concrete outcomes?
3. **Urgency** — Reason to act now vs later?
4. **Credibility** — Evidence, proof, authority?
5. **Emotion** — Does it connect to desires/fears?

### Step 4: Form Optimization Audit
- Count form fields (each field = ~7% drop in conversions)
- Check for inline validation
- Progressive disclosure of fields
- Auto-fill support
- Error message clarity
- Mobile keyboard optimization

### Step 5: Mobile Responsiveness Audit
- Tap target sizes (min 44x44px)
- Text readability without zooming
- Image optimization
- Scroll depth and content priority
- Sticky CTA visibility

### Step 6: A/B Test Recommendations
Format as testable hypotheses:
```
HYPOTHESIS: If we [change], then [metric] will [direction] by [amount]
because [reasoning based on evidence].

PRIORITY: [High/Medium/Low]
EFFORT: [Hours/Days/Weeks]
EXPECTED IMPACT: [X-Y% improvement]
```

Generate 5-10 test hypotheses, prioritized by expected impact / effort ratio.

## Output
Save to `outputs/[entity]/marketing/LANDING-CRO.md`

## Source
Adapted from zubair-trabzada/ai-marketing-claude (market-landing) for Apex Vision
