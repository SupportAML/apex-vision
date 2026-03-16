import { task } from "@trigger.dev/sdk";
import { getClaude, saveOutput, dateStamp, loadEntityFile } from "./config.js";

// Scans multiple sources for trending topics relevant to the AI influencer

interface TrendScanResult {
  date: string;
  trends: TrendItem[];
  contentSuggestions: ContentSuggestion[];
}

interface TrendItem {
  source: string;
  topic: string;
  relevance: string;
  trendingAudio?: string;
}

interface ContentSuggestion {
  type: "reel" | "feed" | "story" | "carousel";
  format: string; // GRWM, lifestyle, lip-sync, talking-head, skit
  concept: string;
  hook: string;
  trendReference?: string;
  script?: string;
  imagePrompt?: string;
}

export const scanTrends = task({
  id: "influencer-scan-trends",
  maxDuration: 120,
  run: async (): Promise<TrendScanResult> => {
    const claude = getClaude();
    const date = dateStamp();
    const brand = loadEntityFile("brand.md");
    const config = loadEntityFile("config.md");

    const response = await claude.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are the trend engine for an AI Instagram influencer. Today is ${date}.

## Character
${config}

## Brand Voice
${brand}

## Your Job
Generate today's content plan. Think about what's trending RIGHT NOW on Instagram Reels, TikTok, and in the South Asian beauty/fashion/luxury space.

Return valid JSON with this exact structure:
{
  "trends": [
    {
      "source": "instagram|tiktok|bollywood|fashion|general",
      "topic": "what's trending",
      "relevance": "why it fits our character",
      "trendingAudio": "name of trending sound if applicable"
    }
  ],
  "contentSuggestions": [
    {
      "type": "reel|feed|story|carousel",
      "format": "GRWM|lifestyle|lip-sync|talking-head|skit",
      "concept": "detailed concept description",
      "hook": "the first 1.5 seconds that stops the scroll",
      "trendReference": "which trend this references",
      "script": "full script if talking-head or voiceover (15-45 sec)",
      "imagePrompt": "Flux/Midjourney prompt for the reference image"
    }
  ]
}

Generate exactly:
- 5-8 trending topics
- 1 Reel concept (prioritize GRWM 35%, lifestyle 25%, lip-sync 20%, talking-head 15%, skit 5%)
- 1 Feed post concept (editorial photo or carousel)
- 3 Story concepts (polls, Q&A, behind-the-scenes, affiliate)

For image prompts: describe the character as "stunning young Indian woman, 24, warm golden-brown skin, long dark hair, deep brown eyes, full lips, beauty mark near lip" and include specific scene details, lighting, camera angle, and style reference.

Be specific with scripts. Write actual copy, not placeholders. Match her personality: confident, worldly, elegant but approachable. Mix of Bollywood glamour and international fashion.

Return ONLY the JSON, no markdown wrapping.`,
        },
      ],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    let parsed: any;
    try {
      // Try parsing directly, or extract from code block
      const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[1] : rawText);
    } catch {
      console.error("Failed to parse trend scan response:", rawText.slice(0, 500));
      parsed = { trends: [], contentSuggestions: [] };
    }

    const result: TrendScanResult = {
      date,
      trends: parsed.trends || [],
      contentSuggestions: parsed.contentSuggestions || [],
    };

    // Save the scan results
    saveOutput(
      "scripts",
      `trend-scan_${date}.json`,
      JSON.stringify(result, null, 2)
    );

    console.log(
      `Trend scan complete: ${result.trends.length} trends, ${result.contentSuggestions.length} content suggestions`
    );

    return result;
  },
});
