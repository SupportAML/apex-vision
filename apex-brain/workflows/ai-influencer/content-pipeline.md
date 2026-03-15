# Instagram Content Pipeline - AI Influencer
schedule: daily

## Objective
Generate and publish daily Instagram content for the AI influencer account, maintaining character consistency and brand voice.

## Schedule
Daily, 11am EST (optimal posting time for South Asian diaspora + US audience overlap)

## Steps

### 1. Topic Selection
- Pull from content calendar (weekly themes planned in advance)
- Check trend-scout for trending fashion/travel/beauty topics
- Cross-reference with top-performing past content
- Select content pillar based on 40/30/20/10 split (fashion/travel/beauty/personal)

### 2. Image Generation
- Load character LoRA model
- Generate 3-5 image variations using Midjourney v7 or Flux 2 Pro
- Apply scene/location context from content brief
- Run consistency check against reference images (face, skin tone, proportions)
- Select best image, touch up with Flux Kontext if needed

### 3. Caption Generation
- Generate 2-3 caption variations matching brand voice
- Include relevant hashtags (mix of reach + niche tags)
- Add CTA where appropriate (save this, share with a friend, link in bio)
- For affiliate posts: include natural product mention + tracked link

### 4. Review & Approve
- Queue in dashboard approval queue
- Auto-approve if: consistency score > 95% AND caption matches approved tone examples
- Flag for manual review if: new brand mention, new location, or first-time content type

### 5. Publish
- Post via Instagram API (or scheduling tool Buffer/Later)
- Cross-post to Stories with engagement sticker (poll, question, slider)
- Update content log with post details

### 6. Track & Optimize
- Log engagement metrics at 24hr and 7-day marks
- Feed results back into content selection algorithm
- Flag top performers for replication
- Flag underperformers for content type adjustment

## Skills Used
- social-media-content
- trend-scout
- competitor-analysis

## Tools Needed
- tools/generate_ai_image.py (new - wraps Midjourney/Flux API)
- tools/post_to_instagram.py (new - Instagram Graph API)
- tools/fanvue_content.py (new - Fanvue upload API)

## Output
- Images + captions saved to outputs/ai-influencer/instagram/
- Engagement data logged to outputs/ai-influencer/analytics/
