import { task } from "@trigger.dev/sdk";
import { getNotion, NOTION_DB_ID, Platform } from "./config.js";
import { postLinkedin } from "./post-linkedin.js";
import { postTwitter } from "./post-twitter.js";
import { processFeedback } from "./process-feedback.js";

/**
 * Auto-post dispatcher — routes approved content to the correct platform posting task.
 * Called after marketer approval from the dashboard.
 */
export const autoPostDispatcher = task({
  id: "marketing-auto-post",
  maxDuration: 120,
  run: async (payload: {
    notionPageId: string;
    platform: Platform;
    entity: string;
  }) => {
    const notion = getNotion();

    // Read content from Notion page
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

    if (!content) {
      console.error("No content found in Notion page:", payload.notionPageId);
      return { status: "error", error: "No content found" };
    }

    // Extract the main post text (before any --- separators or metadata)
    const mainText = content.split("\n---\n")[0].trim();

    let postUrl: string | undefined;
    let postStatus: string = "published";

    try {
      switch (payload.platform) {
        case "linkedin": {
          const result = await postLinkedin.triggerAndWait({
            entity: payload.entity,
            text: mainText,
          });
          postUrl = result?.postUrl;
          break;
        }

        case "twitter": {
          const result = await postTwitter.triggerAndWait({
            entity: payload.entity,
            text: mainText,
          });
          postUrl = result?.tweetUrl;
          break;
        }

        case "instagram": {
          // Instagram posts require an image — check if there's an image URL
          // For now, log that Instagram requires the image generation step first
          console.log(
            `Instagram post for ${payload.entity} — image generation and posting should be handled by the influencer pipeline`
          );
          postStatus = "pending_image";
          break;
        }

        default:
          console.error(`Unknown platform: ${payload.platform}`);
          return { status: "error", error: `Unknown platform: ${payload.platform}` };
      }
    } catch (err: any) {
      console.error(`Failed to post to ${payload.platform}:`, err.message);
      postStatus = "error";

      // Update Notion status to indicate failure
      await notion.pages.update({
        page_id: payload.notionPageId,
        properties: {
          Status: { select: { name: "Error" } },
        },
      });

      return { status: "error", error: err.message, platform: payload.platform };
    }

    // Update Notion with published status and post URL
    if (postStatus === "published") {
      const updateProps: any = {
        Status: { select: { name: "Published" } },
      };

      await notion.pages.update({
        page_id: payload.notionPageId,
        properties: updateProps,
      });

      // Add permalink as a comment
      if (postUrl) {
        await notion.comments.create({
          parent: { page_id: payload.notionPageId },
          rich_text: [
            {
              text: {
                content: `Published to ${payload.platform}: ${postUrl}`,
              },
            },
          ],
        });
      }

      // Log the approval in the learning system
      await processFeedback.trigger({
        notionPageId: payload.notionPageId,
        action: "approved",
        entity: payload.entity,
        platform: payload.platform,
        contentType: "post",
        content: mainText,
      });
    }

    console.log(`Auto-post to ${payload.platform} for ${payload.entity}: ${postStatus}`);
    return {
      status: postStatus,
      platform: payload.platform,
      entity: payload.entity,
      postUrl,
    };
  },
});
