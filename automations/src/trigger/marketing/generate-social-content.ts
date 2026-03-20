import { task } from "@trigger.dev/sdk";
import {
  getClaude,
  loadEntityContext,
  loadSkillContext,
  loadLearnings,
  pushToNotionReview,
  getReviewers,
  CLAUDE_MODEL,
  MAX_TOKENS,
  Platform,
  timestamp,
} from "./config.js";
import { sendReviewEmail } from "../outputs/send-review-email.js";

interface GeneratedContent {
  platform: Platform;
  text: string;
  hashtags: string[];
  imagePrompt?: string;
  caption?: string;
}

interface ContentGenerationResult {
  entity: string;
  date: string;
  content: GeneratedContent[];
  notionPageIds: string[];
}

/**
 * Generate platform-specific social media content for a single entity.
 * Creates LinkedIn posts, X tweets, and Instagram posts with captions/hashtags.
 */
export const generateSocialContent = task({
  id: "marketing-generate-social-content",
  maxDuration: 300,
  run: async (payload: {
    entity: string;
    platforms: Platform[];
    date: string;
    topic?: string;
  }): Promise<ContentGenerationResult> => {
    const claude = getClaude();

    // Load all context
    const [entityContext, skillContext, learnings] = await Promise.all([
      loadEntityContext(payload.entity),
      loadSkillContext("social-media-content"),
      loadLearnings(payload.entity),
    ]);

    const systemPrompt = `You are the Apex Brain marketing content creator for "${payload.entity}".
Your job is to create high-quality, platform-specific social media content that drives engagement and reaches the right audience.

## Entity Context
${entityContext}

## Social Media Content Skill
${skillContext}

## Learnings from Past Feedback
${learnings || "No learnings yet — this is our first batch."}

## Rules
- Match the entity's brand voice exactly
- Each platform gets unique content optimized for its format and audience
- LinkedIn: professional, thought-leadership, 1500-2500 chars, relevant hashtags
- Twitter/X: concise, punchy, under 280 chars, 2-3 hashtags max
- Instagram: visual-first, caption with storytelling, 5-10 hashtags, include an image prompt
- For Instagram, always include a detailed image_prompt for AI image generation
- Use the content pillar rotation (Educational, Behind the Scenes, Social Proof, Engagement, Promotional)
- Return valid JSON array only — no markdown wrapping`;

    const userPrompt = `Generate social media content for ${payload.entity} on ${payload.date}.
Platforms: ${payload.platforms.join(", ")}
${payload.topic ? `Topic focus: ${payload.topic}` : "Choose an appropriate topic based on entity context and content pillar rotation."}

Return a JSON array of objects, one per platform:
[
  {
    "platform": "linkedin" | "twitter" | "instagram",
    "text": "the post text",
    "hashtags": ["tag1", "tag2"],
    "caption": "Instagram caption if applicable",
    "image_prompt": "Detailed image generation prompt for Instagram/visual posts"
  }
]`;

    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";

    // Parse the JSON response
    let contentItems: any[];
    try {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      contentItems = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      console.error("Failed to parse content JSON, raw:", rawText.slice(0, 500));
      contentItems = [];
    }

    // Map to typed content
    const generated: GeneratedContent[] = contentItems.map((item: any) => ({
      platform: item.platform as Platform,
      text: item.text || "",
      hashtags: item.hashtags || [],
      imagePrompt: item.image_prompt || undefined,
      caption: item.caption || undefined,
    }));

    // Push each item to Notion for review
    const notionPageIds: string[] = [];
    const reviewers = await getReviewers(payload.entity);

    for (const item of generated) {
      const fullText = item.caption
        ? `${item.text}\n\n---\nCaption: ${item.caption}\n\nHashtags: ${item.hashtags.map((t) => `#${t}`).join(" ")}`
        : `${item.text}\n\nHashtags: ${item.hashtags.map((t) => `#${t}`).join(" ")}`;

      const imageNote = item.imagePrompt
        ? `\n\n---\nImage Prompt: ${item.imagePrompt}`
        : "";

      const result = await pushToNotionReview({
        entity: payload.entity,
        platform: item.platform,
        contentType: "post",
        title: `${item.platform} post — ${payload.date}`,
        body: fullText + imageNote,
      });

      notionPageIds.push(result.pageId);

      // Send review email if reviewers configured
      if (reviewers.length > 0) {
        try {
          await sendReviewEmail.triggerAndWait({
            entitySlug: payload.entity,
            outputType: `social-${item.platform}`,
            fileName: `${item.platform}-${payload.date}`,
            content: fullText + imageNote,
            reviewers,
            notionPageId: result.pageId,
            version: 1,
          });
        } catch (err) {
          console.error(`Failed to send review email for ${item.platform}:`, err);
        }
      }
    }

    console.log(
      `Generated ${generated.length} content items for ${payload.entity}: ${generated.map((g) => g.platform).join(", ")}`
    );

    return {
      entity: payload.entity,
      date: payload.date,
      content: generated,
      notionPageIds,
    };
  },
});
