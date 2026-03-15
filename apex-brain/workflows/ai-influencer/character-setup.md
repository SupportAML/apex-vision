# Character Setup Workflow - AI Influencer
schedule: one-time (Phase 0)

## Objective
Create a consistent, photorealistic AI character that can be generated in any scene while maintaining identity.

## Steps

### 1. Base Character Design
- Use Midjourney v7 to generate 20+ candidate face/body shots
- Vary: angles, expressions, lighting, outfits
- Select the 5 best images that feel like the same person
- Get approval from Abhi on the final look

### 2. LoRA Training
- Prepare training dataset: 15-20 curated images of the chosen face
- Train LoRA model using Flux (via Replicate, CivitAI, or local ComfyUI)
- Parameters: 1500-2000 training steps, learning rate 1e-4
- Test with 10 diverse prompts (different outfits, locations, lighting)
- Validate: does she look like the same person in every shot?

### 3. Reference Sheet Creation
- Generate a character reference sheet: front, 3/4, profile, full body
- Document: exact skin tone hex, hair color, eye color, distinguishing features
- Save to entities/ai-influencer/reference/

### 4. Style Testing
- Generate test images across all content pillars:
  - Fashion editorial (studio, high fashion)
  - Travel (beach, city, hotel)
  - Casual lifestyle (cafe, home, street)
  - Beauty close-up (makeup, skincare)
- Verify consistency holds across all scenarios
- Adjust LoRA if drift detected

### 5. Bio & Profile Setup
- Create Instagram account (Business/Creator profile)
- Write bio matching brand voice
- Design profile picture and highlights covers
- Set up Linktree or equivalent with affiliate links

## Skills Used
- social-media-content (for bio/copy)
- frontend-design (for visual assets)

## Output
- Trained LoRA model file
- Character reference sheet (saved to entities/ai-influencer/reference/)
- Instagram account configured and ready for content
- 10+ approved test images as baseline examples
