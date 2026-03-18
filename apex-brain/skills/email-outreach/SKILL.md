# Email Outreach

Create and manage email outreach sequences for lead generation and recruitment.
Also serves as the handler for `/market emails` (full email sequence generation).

## What It Does
- Draft personalized cold emails based on recipient research
- Multi-touch follow-up sequences (3-5 emails over 2 weeks)
- A/B test subject lines
- Track open/response signals when integrated with email tools
- Adapt tone per entity brand guide
- Generate complete sequences: welcome, nurture, launch, cart abandonment, cold outreach

## Inputs
- Entity name
- Recipient type (law firm, physician, investor, etc.)
- Recipient details (name, firm, specialty)
- Sequence length
- Goal (get a meeting, get a case, recruit)

## Outputs
- Email sequence (subject + body per touch)
- Saved to outputs/[entity]/outreach/

## Email Sequence Types (`/market emails`)

### 1. Welcome Sequence (5-7 emails)
- Deliver lead magnet → Quick win → Story + credibility → Objection handling → Soft CTA
- Template: `apex-brain/templates/marketing/email-welcome.md`

### 2. Cold Outreach Sequence (5 emails)
- Cold intro → Value add → Social proof → Direct ask → Break-up
- Keep under 100 words per email, personalize first line

### 3. Lead Nurture Sequence (6 emails)
- 70/20/10 rule: 70% value, 20% story, 10% promotion
- Template: `apex-brain/templates/marketing/email-nurture.md`

### 4. Launch Sequence (8 emails)
- Pre-launch (4) → Launch (4) with urgency escalation
- Template: `apex-brain/templates/marketing/email-launch.md`

### 5. Cart Abandonment (4 emails)
1. Reminder (1 hour) — "You left something behind"
2. Objection (24 hours) — Address top concern
3. Social proof (48 hours) — What others are saying
4. Final offer (72 hours) — Discount or bonus

### Subject Line Formulas
- **Curiosity:** "The [unexpected thing] about [topic]"
- **Benefit:** "How to [achieve result] in [timeframe]"
- **Social Proof:** "[Number] [people] are already [doing thing]"
- **Urgency:** "[Timeframe] left to [opportunity]"
- **Personal:** "[First name], quick question about [topic]"

### Email Structure (One-Email-One-Job)
Each email has exactly ONE goal:
- Open → Subject line job
- Read → First line job
- Click → CTA job
- Reply → Question job

### Compliance Notes
- CAN-SPAM: Physical address, unsubscribe link, honest subject lines
- GDPR: Consent required, easy opt-out, data transparency
- CASL: Express consent for commercial messages to Canadian recipients

### Metrics Benchmarks
| Metric | Cold Email | Welcome | Nurture | Launch |
|--------|-----------|---------|---------|--------|
| Open rate | 20-35% | 40-60% | 25-35% | 30-45% |
| Click rate | 2-5% | 3-7% | 2-5% | 5-10% |
| Reply rate | 3-8% | 2-5% | 1-3% | N/A |

## Source
Adapted from ComposioHQ/awesome-claude-skills + alirezarezvani/claude-skills + zubair-trabzada/ai-marketing-claude (market-emails)
