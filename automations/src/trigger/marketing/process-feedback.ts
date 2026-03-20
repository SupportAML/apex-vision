import { task } from "@trigger.dev/sdk";
import {
  getClaude,
  saveLearning,
  saveApprovedExample,
  logFeedback,
  getNotion,
  NOTION_DB_ID,
  CLAUDE_MODEL,
  Platform,
  ContentType,
} from "./config.js";

/**
 * Process marketer feedback (approval or rejection) and update the learning system.
 *
 * On rejection: Claude extracts a generalizable rule from the feedback → saved to learnings.md
 * On approval: Content saved as an approved example for future few-shot prompting
 */
export const processFeedback = task({
  id: "marketing-process-feedback",
  maxDuration: 120,
  run: async (payload: {
    notionPageId: string;
    action: "approved" | "rejected";
    feedback?: string;
    entity: string;
    platform: string;
    contentType: string;
    marketer?: string;
    content?: string;
  }) => {
    const notion = getNotion();

    // Update Notion page status
    const newStatus = payload.action === "approved" ? "Approved" : "Rejected";
    await notion.pages.update({
      page_id: payload.notionPageId,
      properties: {
        Status: { select: { name: newStatus } },
      },
    });

    if (payload.action === "rejected" && payload.feedback) {
      // Extract a generalizable rule from the feedback using Claude
      const claude = getClaude();
      const response = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 256,
        system: "You are a marketing feedback analyzer. Extract a concise, generalizable rule from the reviewer's feedback that can be applied to future content generation. Return only the rule, one sentence, no quotes.",
        messages: [
          {
            role: "user",
            content: `Entity: ${payload.entity}\nPlatform: ${payload.platform}\nFeedback: ${payload.feedback}\n\nExtract a rule:`,
          },
        ],
      });

      const extractedRule =
        response.content[0].type === "text"
          ? response.content[0].text.trim()
          : payload.feedback;

      // Save the learning
      await saveLearning(
        payload.entity,
        `[${payload.platform}] ${extractedRule}`,
        `Learning from ${payload.platform} rejection: ${extractedRule.slice(0, 60)}`
      );

      // Log feedback
      logFeedback({
        entity: payload.entity,
        platform: payload.platform,
        contentType: payload.contentType,
        action: "rejected",
        feedback: payload.feedback,
        extractedRule,
        marketer: payload.marketer,
      });

      // Add feedback as Notion comment
      await notion.comments.create({
        parent: { page_id: payload.notionPageId },
        rich_text: [
          {
            text: {
              content: `Rejected by ${payload.marketer || "marketer"}:\n${payload.feedback}\n\nExtracted rule: ${extractedRule}`,
            },
          },
        ],
      });

      console.log(`Rejection processed for ${payload.entity}/${payload.platform}: ${extractedRule}`);
      return { action: "rejected", extractedRule };
    }

    if (payload.action === "approved") {
      // Save as approved example for future few-shot learning
      if (payload.content) {
        await saveApprovedExample(payload.entity, payload.platform, payload.content);
      } else {
        // Read content from Notion page
        try {
          const blocks = await notion.blocks.children.list({
            block_id: payload.notionPageId,
          });
          const content = blocks.results
            .map((block: any) => {
              if (block.type === "paragraph") {
                return block.paragraph.rich_text
                  .map((t: any) => t.plain_text)
                  .join("");
              }
              return "";
            })
            .filter(Boolean)
            .join("\n\n");

          if (content) {
            await saveApprovedExample(payload.entity, payload.platform, content);
          }
        } catch (err) {
          console.error("Failed to read content from Notion for example:", err);
        }
      }

      logFeedback({
        entity: payload.entity,
        platform: payload.platform,
        contentType: payload.contentType,
        action: "approved",
        marketer: payload.marketer,
      });

      console.log(`Approval processed for ${payload.entity}/${payload.platform}`);
      return { action: "approved" };
    }

    return { action: payload.action };
  },
});
