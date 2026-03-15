# Character Setup Workflow - AI Influencer
schedule: one-time (Phase 0)

## Objective
Create a consistent, photorealistic AI character with locked face, voice, and video presence that can be generated in any scene and feels like a real person.

## Steps

### 1. Base Character Design (Images)
- Use Midjourney v7 to generate 20+ candidate face/body shots
- Vary: angles, expressions, lighting, outfits
- Indian beauty parameters: warm brown skin, dark hair, deep brown eyes, striking features
- Select the 5 best images that feel like the same person
- Get approval from Abhi on the final look

### 2. LoRA Training (Face Lock)
- Prepare training dataset: 15-20 curated images of the chosen face
- Train LoRA model using Flux (via Replicate, CivitAI, or local ComfyUI)
- Parameters: 1500-2000 training steps, learning rate 1e-4
- Test with 10 diverse prompts (different outfits, locations, lighting)
- Validate: does she look like the same person in every shot?

### 3. Higgsfield Soul ID Setup (Video Lock)
- Upload best reference images to Higgsfield
- Create Soul ID profile — locks the face for all video generations
- Test Soul ID with 5 different video scenarios:
  - Talking to camera (close-up)
  - Walking in a city (full body, motion)
  - Sitting at a table (medium shot, gestures)
  - Getting ready / mirror scene (lifestyle)
  - Outdoor travel scene (different lighting)
- Validate: does she look like the same person in every video?
- Adjust Soul ID settings if drift detected

### 4. Voice Design (Audio Identity)
- Option A: Design a custom voice in ElevenLabs Voice Design
  - Traits: warm, confident, slight Indian-English accent, conversational, mid-range pitch
  - Generate 10+ test clips with different emotions/contexts
  - Select the best voice profile
- Option B: Find a reference voice (royalty-free voice sample) and clone it
  - Requires 30+ minutes of clean audio
  - Higher fidelity but more setup time
- Lock the voice profile for all future content
- Test voice + lip sync together — does it feel natural?

### 5. Reference Sheet Creation
- Generate a character reference sheet: front, 3/4, profile, full body
- Document: exact skin tone hex, hair color, eye color, distinguishing features
- Include: voice profile ID, Soul ID reference, LoRA model file location
- Save to entities/ai-influencer/reference/

### 6. Video Pipeline Validation
- Produce 3 complete test Reels end-to-end:
  1. Talking head (script → image → video → voice → lip sync → edit)
  2. Cinematic lifestyle (storyboard → multi-shot video → music → edit)
  3. Lip sync to trending audio (reference image → video → lip sync → edit)
- QA each against quality standards (see video-production.md)
- Time the full pipeline — target: <30 min per Reel after setup
- Get approval from Abhi on all 3 test Reels

### 7. Style Testing (Images + Video)
- Generate test content across all content pillars:
  - Fashion editorial (studio, high fashion)
  - Travel (beach, city, hotel, rooftop)
  - Casual lifestyle (cafe, home, street style)
  - Beauty close-up (makeup, skincare routine)
  - Talking head (different topics, emotions)
- Verify image AND video consistency holds across all scenarios
- Adjust LoRA / Soul ID if drift detected

### 8. Bio & Profile Setup
- Create Instagram account (Business/Creator profile)
- Write bio matching brand voice (short, confident, with personality)
- Design profile picture (best headshot from reference images)
- Design highlights covers (consistent brand aesthetic)
- Set up Linktree with affiliate links
- Initial grid: post first 9 images to establish the visual aesthetic
- Optional: set up TikTok and YouTube channel simultaneously

## Skills Used
- social-media-content (for bio/copy)
- frontend-design (for visual assets)

## Tools Needed
- Midjourney v7 (image generation)
- Flux 2 Pro + training platform (LoRA)
- Higgsfield Pro (Soul ID + video)
- ElevenLabs (voice design/clone)
- Kling 3.0 (video generation testing)
- CapCut Pro (editing)

## Output
- Trained LoRA model file (images)
- Higgsfield Soul ID profile (video)
- ElevenLabs voice profile (audio)
- Character reference sheet with all IDs (saved to entities/ai-influencer/reference/)
- 3 approved test Reels demonstrating full pipeline
- 10+ approved test images as baseline examples
- Instagram account configured and ready for daily content
- Documented pipeline with per-Reel production time
