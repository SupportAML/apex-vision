import { schedules } from "@trigger.dev/sdk";
import { getNotion, NOTION_DB_ID } from "./config.js";
import { reviseContent } from "./revise-content.js";
import { publishApproved } from "./publish-approved.js";

/**
 * Poll the Notion database every 30 minutes for status changes or new comments.
 * This is the backup feedback channel — email replies are the primary path.
 *
 * After deploying, create the schedule in Trigger.dev dashboard:
 *   Task: poll-notion-feedback
 *   Cron: 0,30 * * * * (every 30 min)
 */
export const pollNotionFeedback = schedules.task({
  id: "poll-notion-feedback",
  run: async () => {
    const notion = getNotion();

    // Check for pages marked "Approved" (someone changed status in Notion directly)
    const approved = await notion.databases.query({
      database_id: NOTION_DB_ID,
      filter: {
        property: "Status",
        select: { equals: "Approved" },
      },
    });

    for (const page of approved.results) {
      if (!("properties" in page)) continue;
      const props = page.properties as Record<string, any>;

      const entity = props.Entity?.select?.name;
      const outputType = props["Output Type"]?.rich_text?.[0]?.plain_text;
      const fileName = props.File?.rich_text?.[0]?.plain_text;

      if (!entity || !outputType || !fileName) continue;

      await publishApproved.trigger({
        entitySlug: entity,
        outputType,
        fileName,
        notionPageId: page.id,
      });
    }

    // Check for pages in "Revision" status that have unprocessed comments
    const inRevision = await notion.databases.query({
      database_id: NOTION_DB_ID,
      filter: {
        property: "Status",
        select: { equals: "Revision" },
      },
    });

    for (const page of inRevision.results) {
      if (!("properties" in page)) continue;
      const props = page.properties as Record<string, any>;

      const entity = props.Entity?.select?.name;
      const outputType = props["Output Type"]?.rich_text?.[0]?.plain_text;
      const fileName = props.File?.rich_text?.[0]?.plain_text;
      const version = props.Version?.number || 1;

      if (!entity || !outputType || !fileName) continue;

      // Get the latest comment as feedback
      const comments = await notion.comments.list({ block_id: page.id });
      const latestComment = comments.results[comments.results.length - 1];
      if (!latestComment) continue;

      const feedback = latestComment.rich_text
        .map((rt: any) => rt.plain_text)
        .join("");

      // Skip if this looks like a system-generated comment (from process-email-reply)
      if (feedback.startsWith("Feedback from ")) continue;

      await reviseContent.trigger({
        entitySlug: entity,
        outputType,
        fileName,
        notionPageId: page.id,
        feedback,
        currentVersion: version,
      });

      // Update status so we don't re-process
      await notion.pages.update({
        page_id: page.id,
        properties: {
          Status: { select: { name: "Revising" } },
        },
      });
    }

    console.log(
      `Polled Notion: ${approved.results.length} approved, ${inRevision.results.length} in revision`
    );
    return {
      approvedCount: approved.results.length,
      revisionCount: inRevision.results.length,
    };
  },
});
