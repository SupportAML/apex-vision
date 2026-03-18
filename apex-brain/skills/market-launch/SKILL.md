# Market Launch

Product/service launch playbook generator. Creates an 8-week timeline with emails, social posts, partner coordination, and metrics.

## Usage
```
/market launch <product-or-service> --entity <entity>
/market launch "Critical Care Branch" --entity apexmedlaw
```

## Process

### Step 1: Gather Launch Context
- What's being launched? (product, service, feature, branch, website)
- Target audience and market
- Launch date and timeline constraints
- Budget tier
- Existing audience size and channels
- Competitive landscape

### Step 2: Determine Launch Type
| Type | Timeline | Audience |
|------|----------|----------|
| Soft Launch | 2-4 weeks | Existing customers/network |
| Standard Launch | 6-8 weeks | Mixed audience |
| Major Launch | 8-12 weeks | Large public audience |
| Product Hunt | 4-6 weeks | Tech/startup community |
| Local Business | 4-6 weeks | Geographic community |
| Service Expansion | 3-4 weeks | Existing client base + new vertical |
| Partnership | 4-8 weeks | Combined audiences |

### Step 3: 8-Week Timeline

**Weeks 1-2: Foundation**
- Finalize positioning and messaging
- Create core assets (landing page, emails, social graphics)
- Set up analytics and tracking
- Brief team and partners

**Weeks 3-4: Audience Building**
- Teaser content on social channels
- Email list warming
- Partner/influencer outreach
- Early access or waitlist setup

**Weeks 5-6: Pre-Launch**
- Countdown sequences
- Behind-the-scenes content
- Social proof collection (beta testimonials, early results)
- Press/media outreach

**Week 7: Launch Week (Day-by-Day)**
| Day | Action |
|-----|--------|
| Monday | Soft announcement to inner circle |
| Tuesday | Email blast to full list |
| Wednesday | Social media push across all channels |
| Thursday | Partner cross-promotions go live |
| Friday | PR/media coverage push |
| Weekend | Community engagement and Q&A |

**Week 8: Post-Launch**
- Performance analysis and metrics review
- Follow-up sequences for non-converters
- Testimonial and case study collection
- Iteration based on early feedback

### Step 4: Email Sequences
**Pre-Launch (4 emails):**
1. Announcement / Teaser
2. Behind the scenes / Why we built this
3. Early access offer
4. Countdown (24 hours)

**Launch (4 emails):**
1. It's here! (launch day)
2. Social proof + results (day 2)
3. FAQ + objection handling (day 4)
4. Last chance / urgency (day 7)

### Step 5: Social Media Templates
- Twitter/X thread (10-tweet story arc)
- LinkedIn post (problem-solution-proof format)
- Instagram carousel (5-7 slides)
- Short-form video script (60 seconds)

### Step 6: Metrics Dashboard
| Metric | Target | Track |
|--------|--------|-------|
| Email signups/waitlist | [X] | Daily |
| Landing page visits | [X] | Daily |
| Conversion rate | [X]% | Daily |
| Social mentions | [X] | Daily |
| Revenue (if applicable) | $[X] | Daily |
| Press/media coverage | [X] mentions | Weekly |

### Step 7: Budget Allocation Guide
| Tier | Budget | Allocation |
|------|--------|------------|
| Bootstrap | $0-500 | 100% organic content + sweat equity |
| Starter | $500-2K | 60% ads, 20% content, 20% tools |
| Growth | $2K-10K | 40% ads, 30% content, 20% influencer, 10% PR |
| Scale | $10K+ | 30% ads, 25% content, 20% influencer, 15% PR, 10% events |

## Output
Save to `outputs/[entity]/marketing/LAUNCH-PLAYBOOK.md`

## Apex Vision Integration
- Align launch timeline with entity goals from `goals.md`
- Coordinate with social-media-content skill for post generation
- Coordinate with email-outreach skill for sequence creation
- Flag budget requirements that need approval per communication rules

## Source
Adapted from zubair-trabzada/ai-marketing-claude (market-launch) for Apex Vision
