import { task } from "@trigger.dev/sdk";
import { getNotion, NOTION_DB_ID } from "./config.js";
import { reviseContent } from "./revise-content.js";
import { publishApproved } from "./publish-approved.js";

/**
 * Process an inbound email reply from a reviewer.
 * Called via Resend webhook → your API endpoint → trigger.dev.
 *
 * To wire this up:
 * 1. Set up a Resend inbound webhook pointing to your API
 * 2. Your API endpoint calls: await tasks.trigger("process-email-reply", webhookPayload)
 */
export const processEmailReply = task({
  id: "process-email-reply",
  run: async (payload: {
    from: string;
    subject: string;
    text: string;
    /** Base64url-encoded JSON with entity, type, file, notionPageId, version */
    reviewId: string;
  }) => {
    // Decode the review metadata from the email headers
    const meta = JSON.parse(
      Buffer.from(payload.reviewId, "base64url").toString("utf-8")
    ) as {
      entity: string;
      type: string;
      file: string;
      notionPageId: string;
      version: number;
    };

    const replyText = payload.text.trim();
    const isApproval = /^\s*(approved?|lgtm|ship\s*it)\s*$/i.test(replyText);

    const notion = getNotion();

    if (isApproval) {
      // Mark as approved in Notion
      await notion.pages.update({
        page_id: meta.notionPageId,
        properties: {
          Status: { select: { name: "Approved" } },
        },
      });

      // Trigger publish
      await publishApproved.trigger({
        entitySlug: meta.entity,
        outputType: meta.type,
        fileName: meta.file,
        notionPageId: meta.notionPageId,
      });

      console.log(`Approved by ${payload.from}: ${meta.entity}/${meta.type}/${meta.file}`);
      return { action: "approved", approvedBy: payload.from };
    }

    // Treat as revision feedback
    await notion.pages.update({
      page_id: meta.notionPageId,
      properties: {
        Status: { select: { name: "Revision" } },
      },
    });

    // Add feedback as a comment on the Notion page
    await notion.comments.create({
      parent: { page_id: meta.notionPageId },
      rich_text: [
        {
          text: {
            content: `Feedback from ${payload.from}:\n${replyText}`,
          },
        },
      ],
    });

    // Trigger revision
    await reviseContent.trigger({
      entitySlug: meta.entity,
      outputType: meta.type,
      fileName: meta.file,
      notionPageId: meta.notionPageId,
      feedback: replyText,
      currentVersion: meta.version,
    });

    console.log(`Revision requested by ${payload.from}: ${replyText.slice(0, 100)}`);
    return { action: "revision", feedback: replyText, from: payload.from };
  },
});
