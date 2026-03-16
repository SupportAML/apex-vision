import { schedules } from "@trigger.dev/sdk";
import { getClaude, readFile, writeFile, listDir } from "./config.js";
import { pushToNotion } from "./push-to-notion.js";
import { sendReviewEmail } from "./send-review-email.js";

/**
 * Generate daily content for all entities that have a brand.md and reviewers.md.
 * Runs every morning, creates content, pushes to Notion, emails reviewers.
 *
 * After deploying, create the schedule in Trigger.dev dashboard:
 *   Task: generate-daily-content
 *   Cron: 0 8 * * * (8am UTC — adjust for your timezone)
 */
export const generateDailyContent = schedules.task({
  id: "generate-daily-content",
  maxDuration: 300,
  run: async () => {
    const claude = getClaude();
    const entities = await listDir("entities");
    const results = [];

    for (const entity of entities) {
      if (entity.type !== "dir") continue;

      // Only generate for entities that have reviewers configured
      let reviewers: string[] = [];
      try {
        const reviewerContent = await readFile(
          `entities/${entity.name}/reviewers.md`
        );
        reviewers = reviewerContent
          .split("\n")
          .filter((line) => line.match(/^-\s+\S+@\S+/))
          .map((line) => line.replace(/^-\s+/, "").trim());
      } catch {
        continue; // No reviewers = skip this entity
      }

      if (reviewers.length === 0) continue;

      // Read entity context
      let config = "";
      let brand = "";
      let goals = "";
      try {
        config = await readFile(`entities/${entity.name}/config.md`);
      } catch {}
      try {
        brand = await readFile(`entities/${entity.name}/brand.md`);
      } catch {}
      try {
        goals = await readFile(`entities/${entity.name}/goals.md`);
      } catch {}

      // Check what content already exists so we don't repeat
      let existingContent = "";
      try {
        const contentFiles = await listDir(
          `outputs/${entity.name}/content`
        );
        for (const f of contentFiles.slice(-3)) {
          // Last 3 files for context
          try {
            const c = await readFile(
              `outputs/${entity.name}/content/${f.name}`
            );
            existingContent += `\n--- ${f.name} ---\n${c.slice(0, 500)}\n`;
          } catch {}
        }
      } catch {}

      // Load learnings from reviewer feedback
      let globalLearnings = "";
      try {
        globalLearnings = await readFile(
          "skills/social-media-content/learnings.md"
        );
      } catch {}
      let entityLearnings = "";
      try {
        entityLearnings = await readFile(
          `entities/${entity.name}/learnings.md`
        );
      } catch {}

      // Load approved examples for this entity
      let approvedExamples = "";
      try {
        const exampleFiles = await listDir(
          "skills/social-media-content/examples"
        );
        const entityExamples = exampleFiles.filter((f) =>
          f.name.startsWith(entity.name)
        );
        for (const ex of entityExamples.slice(-2)) {
          try {
            const c = await readFile(
              `skills/social-media-content/examples/${ex.name}`
            );
            approvedExamples += `\n--- ${ex.name} ---\n${c.slice(0, 800)}\n`;
          } catch {}
        }
      } catch {}

      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const dayOfWeek = today.toLocaleDateString("en-US", {
        weekday: "long",
      });

      const response = await claude.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are a content strategist for ${entity.name}. Generate today's social media content.

## Entity
${config}

## Brand Voice & Guidelines
${brand}

## Current Goals
${goals}

## Existing Content (for reference — don't repeat these)
${existingContent || "None yet"}

${globalLearnings ? `## Learnings from Reviewer Feedback (APPLY THESE)\n${globalLearnings}\n` : ""}
${entityLearnings ? `## ${entity.name}-Specific Learnings\n${entityLearnings}\n` : ""}
${approvedExamples ? `## Approved Examples (match this quality and style)\n${approvedExamples}\n` : ""}

## Today
${dayOfWeek}, ${dateStr}

## Instructions
Create today's social media content package:

1. **Twitter/X posts** (2-3 tweets)
   - At least one should reference current trends, news, or timely topics in the industry
   - Mix educational, personality, and engagement tweets
   - Include relevant hashtags

2. **Instagram** (1 post idea)
   - Caption + content type (carousel, reel, photo)
   - Optimized for saves and shares

3. **LinkedIn** (1 post if relevant to the entity type)

Format as clean markdown. Be specific with copy — write the actual tweets and captions, not placeholders. Match the brand voice exactly. No generic filler.`,
          },
        ],
      });

      const content =
        response.content[0].type === "text" ? response.content[0].text : "";
      const fileName = `daily-${dateStr}.md`;

      // Write to repo
      await writeFile(
        `outputs/${entity.name}/content/${fileName}`,
        content,
        `Generate daily content for ${entity.name} (${dateStr})`
      );

      // Push to Notion
      const notionResult = await pushToNotion.triggerAndWait({
        entitySlug: entity.name,
        outputType: "content",
        fileName,
      });

      // Send review email
      const pageId =
        notionResult.ok && notionResult.output
          ? (notionResult.output as any).pageId
          : "";

      if (pageId) {
        await sendReviewEmail.trigger({
          entitySlug: entity.name,
          outputType: "content",
          fileName,
          notionPageId: pageId,
        });
      }

      results.push({
        entity: entity.name,
        fileName,
        notionPageId: pageId,
        reviewers: reviewers.length,
      });

      console.log(`Generated daily content for ${entity.name}: ${fileName}`);
    }

    console.log(`Daily content generation complete: ${results.length} entities`);
    return { generated: results.length, results };
  },
});
