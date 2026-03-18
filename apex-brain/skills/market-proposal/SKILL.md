# Market Proposal

Client proposal generator with tiered pricing, ROI projections, and follow-up sequences. Built for closing retainers.

## Usage
```
/market proposal <client-name> --entity <entity>
/market proposal "Smith & Associates Law" --entity nlc
```

## Process

### Step 1: Gather Proposal Inputs
- Client name and business URL
- Services being proposed
- Client's stated pain points
- Budget range (if known)
- Decision maker and timeline
- How they found you / referral source

### Step 2: Discovery Call Questions
If preparing for a call, generate these 10 essential questions:
1. What's the #1 challenge in your marketing right now?
2. What have you tried before? What worked, what didn't?
3. What does success look like in 90 days?
4. Who is your ideal customer?
5. What's your current monthly marketing spend?
6. Who are your top 3 competitors?
7. What's your average customer lifetime value?
8. How are you currently generating leads?
9. What's your decision timeline?
10. Besides yourself, who else is involved in this decision?

### Step 3: Build the Proposal Document

**Section 1: Cover Page**
- Your company name and logo placeholder
- Client company name
- Date and proposal number
- "Prepared exclusively for [Client Name]"

**Section 2: Executive Summary**
- 2-3 sentences capturing the opportunity
- The core problem you'll solve
- Expected outcome in one sentence

**Section 3: Situation Analysis**
- Run `/market audit` on their URL if not already done
- Reference key findings (top 3 issues, scores)
- Show you understand their business deeply

**Section 4: Strategy & Approach**
- Your methodology (show a framework, not just a list)
- Why this approach works for their specific situation
- Timeline with milestones

**Section 5: Scope of Work**
- Detailed deliverables by month
- What's included vs excluded
- Your team/tools involved

**Section 6: Investment (3-Tier Pricing)**
| | Starter | Growth | Scale |
|---|---------|--------|-------|
| Monthly retainer | $X | $Y | $Z |
| Included hours | X | Y | Z |
| Deliverables | [list] | [list] | [list] |
| Reporting | Monthly | Bi-weekly | Weekly |
| Strategy calls | 1/month | 2/month | Weekly |
| **Best for** | [profile] | [profile] | [profile] |

**Recommendation:** Highlight the middle tier as recommended.

**Section 7: ROI Projection**
```
Current state: [X leads/month, Y% conversion, $Z revenue]
After 90 days: [projected improvement with reasoning]
ROI: [projected return vs investment]
```

**Section 8: Case Studies / Social Proof**
- 2-3 relevant examples (from entity's portfolio if available)
- Specific metrics and outcomes
- Client testimonials

**Section 9: Next Steps**
- Clear call to action
- How to accept the proposal
- Start date upon acceptance
- Onboarding process overview

### Step 4: Follow-Up Sequence
| Day | Email | Subject Line Formula |
|-----|-------|---------------------|
| 0 | Send proposal | "Your [Business] Marketing Proposal" |
| 2 | Check-in | "Quick question about the proposal" |
| 5 | Value add | "[Competitor] just did [X] — here's what it means for you" |
| 10 | Social proof | "How [Similar Client] got [Result]" |
| 15 | Scarcity | "Heads up — our Q[X] calendar is filling up" |
| 21 | Break-up | "Should I close your file?" |

### Step 5: Objection Handling
| Objection | Response Framework |
|-----------|-------------------|
| "Too expensive" | ROI reframe + tiered options |
| "Need to think about it" | Identify specific concern + timeline |
| "We have someone" | Audit comparison + second opinion angle |
| "Not the right time" | Opportunity cost + competitor momentum |
| "Can you guarantee results?" | Case studies + milestone-based structure |

## Output
Save to `outputs/[entity]/marketing/CLIENT-PROPOSAL.md`

## Apex Vision Integration
- Pull entity branding from `entities/[entity]/brand.md`
- Reference real case studies from `outputs/[entity]/`
- Use pricing aligned with entity service tiers
- Cross-reference with entity revenue goals

## Source
Adapted from zubair-trabzada/ai-marketing-claude (market-proposal) for Apex Vision
