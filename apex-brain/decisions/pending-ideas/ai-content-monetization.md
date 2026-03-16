# Pending Idea: AI Influencer Content Monetization Pipeline

**Status:** Research complete, automation scaffolded, NOT yet live
**Created:** 2026-03-16
**Branch:** `claude/ai-content-monetization-research-bCUmy`
**Entity:** ai-influencer (Project Priya)

---

## What Was Done

### Research & Strategy
- Full market research on AI influencers (Aitana Lopez, Lil Miquela, etc.) saved to `entities/ai-influencer/RESEARCH.md`
- Brand identity, content pillars, visual style defined in `entities/ai-influencer/brand.md`
- Revenue model (Phase 1-4) and competitive landscape in `entities/ai-influencer/config.md`
- Growth targets and milestones in `entities/ai-influencer/goals.md`
- Character generation prompts (8 Midjourney v7 prompts + consistency tests) in `entities/ai-influencer/character-prompts.md`

### Workflows Created
- `workflows/ai-influencer/character-setup.md` - Face generation + LoRA training
- `workflows/ai-influencer/content-pipeline.md` - Daily content generation flow
- `workflows/ai-influencer/video-production.md` - Full video pipeline (image > video > voice > lip sync)
- `workflows/ai-influencer/growth-strategy.md` - Follower growth playbook
- `workflows/ai-influencer/monetization-funnel.md` - Revenue activation stages

### Trigger.dev Automation (Scaffolded)
All tasks in `automations/src/trigger/influencer/`:
- `daily-pipeline.ts` - Orchestrates the full daily run
- `trend-scanner.ts` - Scrapes trending topics for content hooks
- `generate-image.ts` - Flux LoRA image generation via Replicate
- `generate-video.ts` - Kling 2.1 video generation via Replicate
- `generate-voice.ts` - ElevenLabs voiceover generation
- `lip-sync.ts` - Video + audio sync via Kling
- `post-instagram.ts` - Instagram Graph API posting (Reels, Feed, Stories, Carousels)
- `config.ts` - Shared client factories and helpers

### Output Directories
- `outputs/ai-influencer/instagram/images/`
- `outputs/ai-influencer/instagram/reels/`
- `outputs/ai-influencer/scripts/`
- `outputs/ai-influencer/audio/`
- `outputs/ai-influencer/analytics/`

---

## What Still Needs to Happen

### Before First Run
1. **Get API keys** and set in Trigger.dev env:
   - `REPLICATE_API_TOKEN` - For Flux LoRA image gen + Kling video
   - `KLING_ACCESS_KEY` + `KLING_SECRET_KEY` - For Kling direct API (if using)
   - `ELEVENLABS_API_KEY` - For voice generation
   - `INSTAGRAM_ACCESS_TOKEN` + `INSTAGRAM_BUSINESS_ACCOUNT_ID` - For posting
   - `FLUX_LORA_URL` - Trained LoRA model URL (after character setup)

2. **Run character setup workflow**:
   - Generate 32 base face images in Midjourney v7 using prompts from `character-prompts.md`
   - Pick 5 most consistent faces
   - Upload 20+ training images to Replicate for Flux LoRA training
   - Set the trained model URL as `FLUX_LORA_URL`

3. **Create Trigger.dev schedule**: task `influencer-daily-pipeline`, cron `0 12 * * *` (8am ET)

4. **Install new npm deps** in automations:
   - `replicate` - Replicate API client
   - `elevenlabs` - ElevenLabs SDK (or use fetch)

### After First Run
- Monitor output quality, tune prompts
- Set up Instagram Business account if not done
- Configure review queue (reviewers.md already has Abhi + Samyah)
- Track engagement metrics, feed back into content strategy
- Activate monetization when hitting 10k followers

---

## Cost Estimate (Monthly)
| Service | Est. Cost |
|---------|-----------|
| Midjourney v7 | $30 |
| Replicate (Flux + Kling) | $50-100 |
| ElevenLabs | $22 |
| Epidemic Sound | $15 |
| CapCut Pro | $10 |
| **Total** | **$127-177/mo** |

---

## How to Resume
1. Check out the branch or merge to main
2. Search for `ai-influencer` across the repo to see all related files
3. Follow the "Before First Run" checklist above
4. The automation code is ready to deploy once API keys are set
