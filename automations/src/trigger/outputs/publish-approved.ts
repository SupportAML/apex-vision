import { task } from "@trigger.dev/sdk";
import { getNotion } from "./config.js";

/**
 * Publish approved content. This is a routing task that triggers
 * the appropriate publish action based on output type.
 *
 * Currently logs the publish action. Wire up to your existing
 * tools (post_to_twitter.py, post_to_linkedin.py, deploy_to_vercel.py)
 * as you activate each channel.
 */
export const publishApproved = task({
  id: "publish-approved",
  run: async (payload: {
    entitySlug: string;
    outputType: string;
    fileName: string;
    notionPageId: string;
  }) => {
    const notion = getNotion();

    // Mark as Published in Notion
    await notion.pages.update({
      page_id: payload.notionPageId,
      properties: {
        Status: { select: { name: "Published" } },
      },
    });

    // Route to the right publish action based on output type
    // Add cases here as you wire up publishing tools
    switch (payload.outputType) {
      case "content":
        // Future: call post_to_twitter.py, post_to_linkedin.py
        console.log(
          `Ready to publish content: ${payload.entitySlug}/${payload.fileName}`
        );
        console.log(
          "Wire up social posting tools here when ready"
        );
        break;

      case "website":
        // Future: call deploy_to_vercel.py
        console.log(
          `Ready to deploy website: ${payload.entitySlug}/${payload.fileName}`
        );
        console.log("Wire up Vercel deploy here when ready");
        break;

      default:
        console.log(
          `Approved: ${payload.entitySlug}/${payload.outputType}/${payload.fileName} — no publish action configured for type "${payload.outputType}"`
        );
    }

    return {
      published: true,
      entity: payload.entitySlug,
      type: payload.outputType,
      file: payload.fileName,
    };
  },
});
