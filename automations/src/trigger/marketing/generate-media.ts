import { task } from "@trigger.dev/sdk";
import {
  getClaude,
  loadEntityContext,
  CLAUDE_MODEL,
} from "./config.js";

/**
 * Unified media generation entry point.
 * Wraps existing Replicate (image) and Kling (video) tasks with entity-aware prompting.
 * Adds brand context (colors, style, logos) from entity brand.md.
 */
export const generateMedia = task({
  id: "marketing-generate-media",
  maxDuration: 300,
  run: async (payload: {
    entity: string;
    type: "image" | "video" | "carousel";
    prompt: string;
    platform?: "linkedin" | "twitter" | "instagram";
    count?: number;
  }) => {
    const claude = getClaude();
    const entityContext = await loadEntityContext(payload.entity);

    // Enhance the prompt with entity brand context
    const enhanceResponse = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      system: `You are a visual brand specialist. Enhance image/video generation prompts to match a brand's visual identity. Return only the enhanced prompt text, nothing else.`,
      messages: [
        {
          role: "user",
          content: `Entity context:\n${entityContext}\n\nOriginal prompt: ${payload.prompt}\n\nPlatform: ${payload.platform || "general"}\nMedia type: ${payload.type}\n\nEnhance this prompt to be brand-consistent. Include style, colors, tone. Keep it as a single image generation prompt.`,
        },
      ],
    });

    const enhancedPrompt =
      enhanceResponse.content[0].type === "text"
        ? enhanceResponse.content[0].text.trim()
        : payload.prompt;

    // Platform-specific aspect ratios
    const aspectRatios: Record<string, string> = {
      instagram: "4:5",
      linkedin: "1.91:1",
      twitter: "16:9",
    };
    const aspectRatio = payload.platform
      ? aspectRatios[payload.platform] || "1:1"
      : "1:1";

    switch (payload.type) {
      case "image": {
        // Delegate to existing Replicate image generation
        // Import dynamically to avoid circular deps
        const { generateImage } = await import("../influencer/generate-image.js");
        const result = await generateImage.triggerAndWait({
          prompt: enhancedPrompt,
          aspectRatio,
          count: payload.count || 1,
        });
        return { type: "image", enhancedPrompt, result };
      }

      case "video": {
        // Delegate to existing Kling video generation
        const { generateVideo } = await import("../influencer/generate-video.js");
        const result = await generateVideo.triggerAndWait({
          prompt: enhancedPrompt,
          aspectRatio: payload.platform === "instagram" ? "9:16" : "16:9",
          duration: 5,
        });
        return { type: "video", enhancedPrompt, result };
      }

      case "carousel": {
        // Generate multiple images for a carousel post
        const { generateImage } = await import("../influencer/generate-image.js");
        const slides = payload.count || 5;
        const results = [];

        for (let i = 0; i < slides; i++) {
          const slidePrompt = `${enhancedPrompt} — slide ${i + 1} of ${slides}`;
          const result = await generateImage.triggerAndWait({
            prompt: slidePrompt,
            aspectRatio,
            count: 1,
          });
          results.push(result);
        }

        return { type: "carousel", enhancedPrompt, slides: results };
      }

      default:
        throw new Error(`Unknown media type: ${payload.type}`);
    }
  },
});
