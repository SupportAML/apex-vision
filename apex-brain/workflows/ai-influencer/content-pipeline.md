# Instagram Content Pipeline - AI Influencer
schedule: daily

## Objective
Generate and publish daily Instagram content (images, Reels, carousels) with hyper-realistic video of our AI character. Content follows trending topics and feels indistinguishable from a real person's account.

## Schedule
- **Daily 8am EST:** Trend scan + script generation
- **Daily 10am EST:** Image/video generation queued
- **Daily 11am EST:** Review queue opens (auto-approve or flag)
- **Daily 12pm EST:** Publish window (optimal for South Asian diaspora + US overlap)
- **Daily 6pm EST:** Stories + engagement content

## Daily Content Mix
- 1 Reel (video, 15-60 seconds) — PRIMARY growth driver
- 1 Feed post (image or carousel) — engagement + saves
- 2-3 Stories (polls, Q&A, behind-the-scenes, swipe-ups)
- Weekly: 1 carousel (style guides, travel roundups, beauty routines)

---

## Step 1: Trending Topic Engine

### Auto-scan sources (via trend-scout skill)
- Instagram Explore page: what's trending in fashion, beauty, travel
- TikTok trending sounds/formats (cross-platform trends hit IG 3-7 days later)
- Twitter/X trending topics in lifestyle/fashion
- Google Trends for beauty/fashion/travel queries
- Competitor accounts: what's getting high engagement this week
- Bollywood/South Asian culture moments (festivals, movie releases, fashion weeks)

### Script Generation
- Claude generates 2-3 script options per trending topic
- Script types:
  - **Talking head:** Character speaks directly to camera (hot takes, tips, reactions)
  - **Voiceover narrative:** Character in scenes with voiceover storytelling
  - **Lip sync to trending audio:** Character mouths popular sounds/songs
  - **Silent cinematic:** No dialogue, just vibes + music (luxury travel, GRWM)
  - **POV/skit:** Short storyline format trending on Reels
- Scripts include: hook (first 1.5 sec), body, CTA, suggested trending audio

### Storyline Calendar
Maintain a rolling storyline that builds narrative:
- Week 1-2: "Just landed in Dubai" arc (travel content)
- Week 3-4: "Fashion week prep" arc (style content)
- Month 2: "Mumbai homecoming" arc (cultural connection content)
- Ongoing: Relationship hints, friend appearances (future second AI character), life milestones
- Seasonal: Diwali looks, Eid fashion, holiday travel, summer style

---

## Step 2: Image Generation (Feed Posts + Thumbnails)

- Load character LoRA model (Flux 2 Pro)
- Generate 3-5 image variations matching the day's content brief
- Scene context: location, outfit, lighting, mood from script
- Consistency check against reference sheet (face, skin tone, proportions)
- Touch up with Flux Kontext if needed (background swap, lighting fix)
- For carousels: generate 5-10 consistent images in a series

---

## Step 3: Video Production (Reels)

### 3a. Storyboard
- Use Higgsfield Popcorn to generate 8-10 consistent keyframes
- Lock character via Soul ID
- Map keyframes to script beats

### 3b. Video Generation
Choose tool based on content type:

| Content Type | Primary Tool | Backup |
|---|---|---|
| Talking head / direct camera | Higgsfield (Soul ID + LipSync Studio) | HeyGen |
| Cinematic scenes (travel, fashion) | Kling 3.0 (multi-shot, $0.10/sec) | Veo 3.1 |
| Hero/showcase content | Veo 3.1 (native audio, photorealism) | Runway Gen-4.5 |
| Lip sync to trending audio | Kling LipSync (cheapest) | VEED Fabric 1.0 |
| Quick reaction/POV clips | Higgsfield Motion Control | Pika 2.5 |

### 3c. Voice Generation
- Use ElevenLabs with custom cloned voice profile
- Voice traits: warm, slightly accented English (Indian-international blend), confident, conversational
- Generate audio from script
- For trending audio lip sync: skip this step, use original audio

### 3d. Lip Sync Pass
- Apply lip sync via Kling LipSync or VEED Fabric
- Segment clips to <45 seconds each for best accuracy
- Shift audio 1-3 frames earlier in editor if timing is off
- QA check: no "floating mouth" artifacts, natural jaw movement

### 3e. Edit & Assembly
- CapCut Pro or DaVinci Resolve for final edit
- Add: trending audio/music layer, captions/subtitles (auto-generated), transitions
- Match Instagram Reel format: 9:16 vertical, 1080x1920
- Hook optimization: first 1.5 seconds must stop the scroll
- Export at 30fps, H.264 codec

---

## Step 4: Caption & Hashtags

- Generate 2-3 caption variations matching brand voice
- Short, punchy, personality-forward (not generic influencer captions)
- Include relevant hashtags:
  - Reach (1M+): #fashion #luxurylifestyle #ootd #reels
  - Mid (100K-1M): #indianfashion #desistyle #luxurytravel
  - Niche (10K-100K): #indianbeauty #southasianfashion #aimodel
  - Branded: #[charactername] #[charactername]style
- CTA rotation: "save for later", "share with someone who needs this", "link in bio", "drop a [emoji] if you agree"
- For affiliate posts: natural product mention + tracked link in bio

---

## Step 5: Review & Approve

Queue in Apex Brain dashboard:
- **Auto-approve** if ALL of these:
  - Character consistency score > 95% (face match to reference)
  - Video quality check passes (no artifacts, stable motion, clean lip sync)
  - Caption matches approved tone examples
  - No new brand mentions or controversial topics
- **Flag for manual review** if ANY of these:
  - New brand mention or sponsored content
  - New location or setting not previously used
  - Trending topic that could be sensitive
  - Consistency score below 95%
  - First use of a new content format

---

## Step 6: Publish & Cross-Post

- **Instagram Reel:** Post via API with caption, hashtags, cover image
- **Instagram Feed:** Image/carousel post with separate optimized caption
- **Instagram Stories:** Behind-the-scenes clips, polls, Q&A stickers, affiliate swipe-ups
- **TikTok:** Re-export Reel for TikTok (adjust captions/hashtags)
- **YouTube Shorts:** Re-export for Shorts (adjust description)
- **Pinterest:** Key fashion/beauty images as Pins (long-tail discovery)

---

## Step 7: Track & Optimize

- Log metrics at 1hr, 24hr, and 7-day marks:
  - Views, likes, comments, saves, shares, profile visits, follows
  - Watch time and completion rate (for Reels)
  - Click-through on bio link
- Feed results back into topic selection algorithm
- Flag top performers: what made them work? Replicate the pattern.
- Flag underperformers: what went wrong? Avoid that pattern.
- Weekly trend report: which content types, topics, and formats are winning

---

## Skills Used
- social-media-content
- trend-scout
- competitor-analysis

## Tools Needed (New)
- tools/generate_ai_image.py — wraps Midjourney/Flux API for image generation
- tools/generate_ai_video.py — wraps Kling/Veo/Higgsfield APIs for video generation
- tools/generate_voice.py — wraps ElevenLabs API for voice synthesis
- tools/lip_sync.py — wraps Kling LipSync/VEED API for lip sync pass
- tools/post_to_instagram.py — Instagram Graph API posting
- tools/post_to_tiktok.py — TikTok API cross-posting
- tools/fanvue_content.py — Fanvue upload API
- tools/trend_scanner.py — aggregates trending topics from multiple sources

## Output
- Images saved to outputs/ai-influencer/instagram/images/
- Videos saved to outputs/ai-influencer/instagram/reels/
- Scripts saved to outputs/ai-influencer/scripts/
- Engagement data logged to outputs/ai-influencer/analytics/
