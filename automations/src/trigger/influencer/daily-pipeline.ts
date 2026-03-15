import { schedules, task } from "@trigger.dev/sdk";
import {
  getClaude,
  saveOutput,
  dateStamp,
  timestamp,
  loadEntityFile,
  ENTITY,
} from "./config.js";
import { scanTrends } from "./trend-scanner.js";
import { generateImage, generateImageBatch } from "./generate-image.js";
import { generateVideo, generateVideoMultiShot } from "./generate-video.js";
import { generateVoice } from "./generate-voice.js";
import { lipSync } from "./lip-sync.js";
import { postToInstagram } from "./post-instagram.js";

/**
 * The full daily content pipeline for the AI influencer.
 *
 * Flow:
 * 1. Scan trends + generate scripts
 * 2. Generate reference images (Flux via Replicate)
 * 3. Generate video clips (Kling 3.0)
 * 4. Generate voice (ElevenLabs) if script has dialogue
 * 5. Lip sync pass (Kling LipSync) if voice was generated
 * 6. Queue for review or auto-approve
 * 7. Publish approved content
 *
 * After deploying, create the schedule in Trigger.dev dashboard:
 *   Task: influencer-daily-pipeline
 *   Cron: 0 12 * * * (8am ET)
 */
export const dailyPipeline = schedules.task({
  id: "influencer-daily-pipeline",
  maxDuration: 300,
  run: async () => {
    const date = dateStamp();
    const ts = timestamp();
    console.log(`=== AI Influencer Daily Pipeline: ${date} ===`);

    // --- Step 1: Trend scan + content planning ---
    console.log("Step 1: Scanning trends and generating content plan...");
    const trendResult = await scanTrends.triggerAndWait(undefined as any);
    if (!trendResult.ok || !trendResult.output) {
      throw new Error("Trend scan failed");
    }
    const { contentSuggestions } = trendResult.output;

    // Separate by type
    const reelSuggestion = contentSuggestions.find((s) => s.type === "reel");
    const feedSuggestion = contentSuggestions.find((s) => s.type === "feed");
    const storySuggestions = contentSuggestions.filter((s) => s.type === "story");

    const results: any = {
      date,
      trendScan: trendResult.output,
      reel: null,
      feedPost: null,
      stories: [],
    };

    // --- Step 2: Generate content in parallel ---
    console.log("Step 2: Generating images and video...");

    // Build all image generation requests
    const imagePrompts: any[] = [];

    // Feed post image
    if (feedSuggestion?.imagePrompt) {
      imagePrompts.push({
        prompt: feedSuggestion.imagePrompt,
        aspectRatio: "4:5",
        numOutputs: 3, // Generate 3 options
        loraUrl: process.env.FLUX_LORA_URL,
        label: `feed_${date}`,
      });
    }

    // Reel reference frame
    if (reelSuggestion?.imagePrompt) {
      imagePrompts.push({
        prompt: reelSuggestion.imagePrompt,
        aspectRatio: "9:16",
        numOutputs: 1,
        loraUrl: process.env.FLUX_LORA_URL,
        label: `reel_ref_${date}`,
      });
    }

    // Story images
    for (const story of storySuggestions) {
      if (story.imagePrompt) {
        imagePrompts.push({
          prompt: story.imagePrompt,
          aspectRatio: "9:16",
          numOutputs: 1,
          loraUrl: process.env.FLUX_LORA_URL,
          label: `story_${date}_${storySuggestions.indexOf(story)}`,
        });
      }
    }

    // Launch image batch and video generation in parallel
    const imagePromise = imagePrompts.length > 0
      ? generateImageBatch.triggerAndWait({ prompts: imagePrompts })
      : null;

    // For Reels: generate video from reference image after image gen completes
    // For now, start with text-to-video if no reference image yet
    let videoPromise = null;
    if (reelSuggestion) {
      const needsVoice =
        reelSuggestion.format === "talking-head" ||
        (reelSuggestion.script && reelSuggestion.format !== "lip-sync");

      // Generate video
      videoPromise = generateVideo.triggerAndWait({
        mode: "text-to-video",
        prompt: buildVideoPrompt(reelSuggestion),
        duration: 10,
        aspectRatio: "9:16",
        label: `reel_${date}`,
      });

      // Generate voice if needed (parallel with video)
      let voicePromise = null;
      if (needsVoice && reelSuggestion.script) {
        voicePromise = generateVoice.triggerAndWait({
          text: reelSuggestion.script,
          label: `reel_voice_${date}`,
        });
      }

      // Wait for both
      const [videoResult, voiceResult] = await Promise.all([
        videoPromise,
        voicePromise,
      ]);

      if (videoResult?.ok && videoResult.output) {
        results.reel = {
          video: videoResult.output,
          concept: reelSuggestion.concept,
          hook: reelSuggestion.hook,
          format: reelSuggestion.format,
        };

        // Step 3: Lip sync if we have both video and voice
        if (voiceResult?.ok && voiceResult.output && videoResult.output.localPath) {
          console.log("Step 3: Running lip sync pass...");
          const syncResult = await lipSync.triggerAndWait({
            videoPath: videoResult.output.localPath,
            audioPath: voiceResult.output.localPath,
            label: `reel_final_${date}`,
          });

          if (syncResult?.ok && syncResult.output) {
            results.reel.video = syncResult.output;
            results.reel.lipSynced = true;
          }
        }
      }
    }

    // Wait for images
    if (imagePromise) {
      const imageResult = await imagePromise;
      if (imageResult?.ok && imageResult.output) {
        results.feedPost = {
          images: imageResult.output.results,
          concept: feedSuggestion?.concept,
        };
      }
    }

    // --- Step 4: Generate captions ---
    console.log("Step 4: Generating captions...");
    const captions = await generateCaptions(results);
    results.captions = captions;

    // --- Step 5: Save complete daily package ---
    const packagePath = saveOutput(
      "scripts",
      `daily-package_${date}.json`,
      JSON.stringify(results, null, 2)
    );

    console.log(`=== Pipeline complete: ${packagePath} ===`);
    console.log(
      `Reel: ${results.reel ? "generated" : "skipped"}, ` +
      `Feed: ${results.feedPost ? "generated" : "skipped"}, ` +
      `Stories: ${results.stories.length}`
    );

    // Content is queued for review in the dashboard.
    // Auto-approve will be added once we have consistency scoring.
    return results;
  },
});

/**
 * On-demand pipeline trigger (not scheduled, invoked manually or from dashboard)
 */
export const runPipeline = task({
  id: "influencer-run-pipeline",
  maxDuration: 300,
  run: async (payload: {
    contentType?: "reel" | "feed" | "story";
    concept?: string;
    imagePrompt?: string;
    script?: string;
  }) => {
    // For one-off content generation outside the daily schedule
    const date = dateStamp();

    if (payload.imagePrompt) {
      const result = await generateImage.triggerAndWait({
        prompt: payload.imagePrompt,
        aspectRatio: payload.contentType === "feed" ? "4:5" : "9:16",
        loraUrl: process.env.FLUX_LORA_URL,
        numOutputs: 3,
        label: `ondemand_${date}`,
      });
      return { type: "image", result: result.ok ? result.output : null };
    }

    if (payload.script && payload.contentType === "reel") {
      // Full reel pipeline: video + voice + lip sync
      const [videoResult, voiceResult] = await Promise.all([
        generateVideo.triggerAndWait({
          mode: "text-to-video",
          prompt: payload.concept || payload.script,
          duration: 10,
          aspectRatio: "9:16",
          label: `ondemand_reel_${date}`,
        }),
        generateVoice.triggerAndWait({
          text: payload.script,
          label: `ondemand_voice_${date}`,
        }),
      ]);

      if (videoResult.ok && voiceResult.ok && videoResult.output && voiceResult.output) {
        const syncResult = await lipSync.triggerAndWait({
          videoPath: videoResult.output.localPath,
          audioPath: voiceResult.output.localPath,
          label: `ondemand_synced_${date}`,
        });
        return {
          type: "reel",
          video: videoResult.output,
          voice: voiceResult.output,
          lipSync: syncResult.ok ? syncResult.output : null,
        };
      }

      return {
        type: "reel",
        video: videoResult.ok ? videoResult.output : null,
        voice: voiceResult.ok ? voiceResult.output : null,
      };
    }

    return { error: "Provide imagePrompt for images or script+contentType for reels" };
  },
});

// --- Helpers ---

function buildVideoPrompt(suggestion: any): string {
  const charDesc =
    "stunning young Indian woman, 24, warm golden-brown skin, long dark hair, deep brown eyes, beauty mark near lip";

  return `${charDesc}, ${suggestion.concept}. ${suggestion.hook}. Cinematic quality, natural lighting, shot on iPhone 15 Pro, 9:16 vertical, smooth motion, photorealistic.`;
}

async function generateCaptions(results: any): Promise<any> {
  const claude = getClaude();
  const brand = loadEntityFile("brand.md");

  const response = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate Instagram captions for today's content. Match this brand voice:

${brand}

Today's content:
- Reel concept: ${results.reel?.concept || "none"}
- Feed post concept: ${results.feedPost?.concept || "none"}

Return JSON:
{
  "reelCaption": "caption with hashtags and CTA",
  "feedCaption": "caption with hashtags and CTA",
  "storyCaptions": ["story 1 text", "story 2 text", "story 3 text"]
}

Rules:
- Short, punchy, personality-forward
- Not generic influencer cringe
- Hashtags: mix of reach (1M+), mid (100K-1M), niche (10K-100K)
- CTA rotation: "save for later", "link in bio", "share with someone"
- Her voice: confident, slightly cheeky, warm

Return ONLY the JSON.`,
      },
    ],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
  try {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    return JSON.parse(match ? match[1] : raw);
  } catch {
    return { reelCaption: "", feedCaption: "", storyCaptions: [] };
  }
}
