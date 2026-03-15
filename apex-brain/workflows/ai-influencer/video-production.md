# Video Production Workflow - AI Influencer
schedule: daily (integrated into content pipeline)

## Objective
Produce hyper-realistic video Reels of the AI character that are indistinguishable from real influencer content. Each video should feel like a real person filmed it on their phone or had it professionally shot.

## Content Formats & Templates

### Format 1: Talking Head (40% of Reels)
The character speaks directly to camera. Hot takes, tips, reactions, storytelling.

**Pipeline:**
1. Script (Claude) → 15-45 second monologue with hook
2. Reference image (Flux/Midjourney) → character in setting, camera-facing
3. Video generation (Higgsfield Soul ID) → animate the reference image
4. Voice (ElevenLabs) → generate audio from script
5. Lip sync (Kling LipSync) → sync mouth to audio
6. Edit (CapCut) → add captions, music bed, transitions

**Example scripts:**
- "POV: you're the only Indian girl at Fashion Week and everyone keeps staring" [hook + story]
- "3 outfits I'd wear to a Bollywood wedding vs what my mom wants me to wear" [relatable + cultural]
- "I tried the viral [product] for 30 days — here's what actually happened" [review + affiliate]

### Format 2: Cinematic / Lifestyle (25% of Reels)
No talking — just vibes. Luxury travel, getting ready, walking through cities. Music-driven.

**Pipeline:**
1. Storyboard (Higgsfield Popcorn) → 6-8 keyframes of the scene
2. Video generation (Kling 3.0 multi-shot) → generate each scene segment
3. Or: Veo 3.1 for hero shots with native ambient audio
4. Edit (CapCut) → trending music, smooth transitions, color grade
5. No lip sync needed

**Example concepts:**
- Golden hour on a Dubai rooftop, wind in hair, city below [luxury travel]
- Getting ready for a night out — outfit selection, jewelry, mirror check [GRWM]
- Walking through a Mumbai market in designer outfit [contrast/culture]

### Format 3: Lip Sync to Trending Audio (20% of Reels)
Character mouths trending sounds, songs, dialogues. Highest viral potential.

**Pipeline:**
1. Identify trending audio (trend-scout) → top sounds this week
2. Reference image (Flux) → character in relevant setting
3. Video generation (Higgsfield or Kling) → animate with motion
4. Lip sync (Kling LipSync) → sync to trending audio clip
5. Edit (CapCut) → native feel, no over-production

**Trending audio sources:**
- Instagram Reels trending audio page
- TikTok trending sounds (cross 3-7 days later)
- Bollywood movie dialogues (massive reach in South Asian audience)
- Viral podcast/interview clips

### Format 4: POV / Skit (10% of Reels)
Short storyline format. Multiple "shots" or scenarios.

**Pipeline:**
1. Script (Claude) → 2-4 scene skit with punchline
2. Multi-shot generation (Kling 3.0) → consistent character across scenes
3. Voice + lip sync if dialogue needed
4. Edit (CapCut) → quick cuts, text overlays, sound effects

**Example skits:**
- "Types of aunties at an Indian wedding" [cultural comedy]
- "My outfit vs what the fashion blogs recommended" [comparison]
- "What I ordered vs what arrived" [relatable shopping content]

### Format 5: GRWM / Day-in-My-Life (5% of Reels)
Longer format (45-90 sec). Intimate, behind-the-scenes feel.

**Pipeline:**
1. Script outline (Claude) → narration flow
2. Multiple scene generation (variety of tools based on scene type)
3. Voiceover (ElevenLabs) → warm, conversational narration
4. Edit (CapCut) → music, transitions, phone-camera aesthetic

---

## Quality Standards

### What "Hyper-Real" Means
- Skin texture visible (pores, subtle imperfections) — not plastic/airbrushed
- Natural micro-expressions (blinks, slight smiles, eyebrow raises)
- Clothing physics (fabric moves naturally with body)
- Lighting matches the scene (no flat/uniform lighting)
- Hair movement (wind, head turns)
- Hand gestures look natural (biggest AI tell in 2026 — QA this hard)
- Background has depth and detail (not blurry/generic)

### Red Flags to Reject
- Uncanny valley face (too smooth, wrong proportions)
- Hands with wrong number of fingers or melted joints
- Lip sync drift (mouth doesn't match audio)
- Body morphing between frames
- Inconsistent face (doesn't match reference sheet)
- Floating/glitchy clothing
- Text/watermarks from generation tools

### Per-Video QA Checklist
- [ ] Face matches reference (Soul ID consistency check)
- [ ] Hands look natural (count fingers, check proportions)
- [ ] Lip sync is accurate (if applicable)
- [ ] Clothing physics are natural
- [ ] Background is coherent and detailed
- [ ] No generation artifacts visible
- [ ] Audio quality is clean (no robotic artifacts in voice)
- [ ] Hook is strong (first 1.5 sec is scroll-stopping)
- [ ] Exported in correct format (9:16, 1080x1920, 30fps)

---

## Production Cost Per Reel (Estimated)

| Component | Cost |
|-----------|------|
| Image generation (reference frame) | $0.05-0.20 |
| Video generation (15-60 sec) | $1.50-6.00 |
| Voice generation | $0.10-0.50 |
| Lip sync pass | $0.50-2.00 |
| Music/audio license | Included in subscription |
| **Total per Reel** | **$2-9** |
| **Monthly (30 Reels)** | **$60-270** |

At scale with bulk generation and optimized workflows, cost drops to $2-4 per Reel.

---

## Tools API Reference

### Higgsfield
- Soul ID: character lock for face consistency
- Popcorn: storyboard generation (8-10 frames)
- Motion Control: reference video mimicry
- LipSync Studio: built-in lip sync
- API access on Pro plan ($75/mo)

### Kling 3.0
- Multi-shot generation: 3-15 second sequences with consistent character
- Native audio: synchronized dialogue + sound effects
- LipSync module: animate photos to match audio
- API: $0.10/sec via official API or FAL.AI

### Google Veo 3.1
- Best photorealism for hero shots
- Native audio generation (dialogue + ambient)
- "Ingredients to Video": upload reference images for consistency
- Access via Google AI Studio / VideoFX

### ElevenLabs
- Custom voice clone: train on 30+ minutes of reference audio
- Or design a voice from scratch with Voice Design
- Multilingual support (English + Hindi for our use case)
- API: $0.30 per 1,000 characters (~$22/mo for our volume)

---

## Automation Integration

This workflow plugs into the Apex Brain automation pipeline:
1. Trigger.dev daily task generates scripts + storyboards
2. API calls to generation tools run in parallel
3. Results queued in dashboard for review
4. Approved content auto-posted via scheduling tool
5. Analytics fed back to optimize next day's content

Target: 80% of daily content production runs without human intervention after Month 2.
