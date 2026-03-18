# Social Media Content

Generate platform-specific social media posts for LinkedIn, Instagram, Threads, and Twitter.
Also serves as the handler for `/market social` (30-day content calendar generation).

## What It Does
- Creates posts tailored to each platform's format and audience
- Generates accompanying visual concepts/descriptions for image creation
- Supports multiple variations per post for A/B testing
- Learns from approved examples to match brand voice over time
- Generates 30-day content calendars with pillar rotation
- Provides hook formulas and hashtag strategies

## Inputs
- Entity name (to load brand.md for tone)
- Topic or content brief
- Platform(s) to target
- Optional: reference post or approved example

## Outputs
- Post text per platform (with hashtags, formatting)
- Image prompt or visual description
- Saved to outputs/[entity]/social/

## Usage
```
Topic: "NLC just won a complex neurosurgery malpractice case"
Platforms: LinkedIn, Instagram
Variations: 3
```

## 30-Day Calendar Mode (`/market social`)

When generating a full calendar:

### Content Pillars (5-Day Rotation)
1. **Educational** — Teach, how-to, tips, frameworks
2. **Behind the Scenes** — Process, team, culture, day-in-life
3. **Social Proof** — Results, testimonials, case studies
4. **Engagement** — Questions, polls, debates, community
5. **Promotional** — Products, services, offers, CTAs

### Platform Specs
| Platform | Max Length | Best Time | Frequency |
|----------|-----------|-----------|-----------|
| LinkedIn | 3,000 chars | 8-10am or 12-1pm weekdays | 3-5x/week |
| Instagram | 2,200 chars | 11am-1pm or 7-9pm | 4-7x/week |
| Twitter/X | 280 chars | 9-11am weekdays | 3-7x/week |
| TikTok | 300 chars | 7-9am, 12-3pm, 7-11pm | 3-5x/week |

### Hook Formulas by Pillar
- **Educational:** "Most {industry} businesses get this wrong..."
- **BTS:** "Here's what a day at {business} actually looks like:"
- **Social Proof:** "{Client} came to us with {problem}. Here's what happened:"
- **Engagement:** "Hot take: {opinion}. Agree or disagree?"
- **Promotional:** "Introducing {product} — built for {audience}"

### Hashtag Strategy
- 3-5 niche hashtags (< 100K posts)
- 2-3 medium hashtags (100K-500K posts)
- 1-2 broad hashtags (500K+ posts)
- 1 branded hashtag

### Repurposing Workflow
1. Write one long-form piece (blog or LinkedIn article)
2. Extract 5 key points → 5 social posts
3. Create 1 carousel from the key points
4. Record 1 short video (60s) on the topic
5. Pull 3 quotes for standalone graphics

### Calendar Generator Script
```bash
python scripts/marketing/social_calendar.py "Business Name" "industry" output.json
```

### Template
See `apex-brain/templates/marketing/content-calendar.md`

## Source
Adapted from alirezarezvani/claude-skills (marketing pod) + ComposioHQ/awesome-claude-skills + zubair-trabzada/ai-marketing-claude (market-social)
