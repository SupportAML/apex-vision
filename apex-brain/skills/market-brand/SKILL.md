# Market Brand

Analyze brand voice and generate brand guidelines from any website or content samples.

## Usage
```
/market brand <url>
/market brand <url> --entity nlc
```

## Process

### Step 1: Gather Source Material
- Fetch website copy (homepage, about, key pages)
- If entity specified, load existing `brand.md` for comparison
- Collect social media bios and recent posts if available
- Note: minimum 500 words of source material needed for accurate analysis

### Step 2: Voice Dimension Analysis
Score on 4 axes (1-10 scale):
- **Formal ←→ Casual** (1 = academic, 10 = conversational)
- **Serious ←→ Playful** (1 = corporate, 10 = fun/witty)
- **Technical ←→ Simple** (1 = jargon-heavy, 10 = plain language)
- **Reserved ←→ Bold** (1 = understated, 10 = provocative)

### Step 3: Tone Spectrum Mapping
Map how tone shifts across contexts:
| Context | Primary Tone | Secondary Tone |
|---------|-------------|----------------|
| Homepage | Confident | Welcoming |
| Sales pages | Urgent | Trustworthy |
| Blog/Content | Educational | Relatable |
| Social media | Casual | Engaging |
| Email | Personal | Professional |
| Support/FAQ | Helpful | Clear |

### Step 4: Brand Personality Framework
Identify primary archetype (pick ONE dominant + ONE secondary):
- **Authority** — Expert, credible, data-driven ("We wrote the book on...")
- **Innovator** — Forward-thinking, disruptive, tech-first ("The future of...")
- **Friend** — Approachable, warm, community-focused ("We're here for you")
- **Rebel** — Contrarian, bold, challenging norms ("Stop doing X wrong")
- **Guide** — Wise mentor, process-oriented ("Here's how to...")

### Step 5: Vocabulary Analysis
- **Power words** used frequently (list top 10)
- **Words to avoid** (identify off-brand language)
- **Industry jargon** — keep or simplify?
- **Sentence length** — average and ideal range
- **Paragraph structure** — typical pattern

### Step 6: Competitor Voice Comparison
| Dimension | [Business] | Comp 1 | Comp 2 | Comp 3 |
|-----------|-----------|--------|--------|--------|
| Formal/Casual | X/10 | X/10 | X/10 | X/10 |
| Serious/Playful | X/10 | X/10 | X/10 | X/10 |
| Technical/Simple | X/10 | X/10 | X/10 | X/10 |
| Reserved/Bold | X/10 | X/10 | X/10 | X/10 |

### Step 7: Consistency Audit
- Score consistency across pages (0-100)
- Flag pages where voice deviates from core identity
- Identify if multiple writers with different styles

### Step 8: Brand Messaging Hierarchy
1. **Tagline** (5-8 words)
2. **Value proposition** (1 sentence)
3. **Elevator pitch** (30 seconds / 2-3 sentences)
4. **Brand story** (2-3 paragraphs)

### Step 9: Voice Chart
| Element | Do | Don't |
|---------|-----|-------|
| Headlines | [example] | [example] |
| CTAs | [example] | [example] |
| Descriptions | [example] | [example] |
| Social posts | [example] | [example] |

### Step 10: Generate Copy Samples
Write 3 sample pieces in the identified voice:
1. Homepage hero section
2. Social media post
3. Email subject + opening paragraph

## Output
Save to `outputs/[entity]/marketing/BRAND-VOICE.md`

## Apex Vision Integration
- If entity has existing `brand.md`, compare and suggest updates
- Feed brand voice dimensions into social-media-content and email-outreach skills
- Store voice profile for consistent output across all entity content

## Source
Adapted from zubair-trabzada/ai-marketing-claude (market-brand) for Apex Vision
