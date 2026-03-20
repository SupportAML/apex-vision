import { task } from "@trigger.dev/sdk";
import { getResend, getNotion, REVIEW_FROM_EMAIL } from "./config.js";

/**
 * Send an individual approved marketing email via Resend.
 * Called after marketer approves an email from the dashboard.
 */
export const sendMarketingEmail = task({
  id: "marketing-send-email",
  maxDuration: 60,
  run: async (payload: {
    to: string;
    subject: string;
    body: string;
    entity: string;
    notionPageId: string;
    fromName?: string;
  }) => {
    const resend = getResend();
    const notion = getNotion();

    const fromEmail = process.env.MARKETING_FROM_EMAIL || REVIEW_FROM_EMAIL;
    const fromName = payload.fromName || payload.entity.toUpperCase();

    // Add CAN-SPAM compliant footer
    const unsubscribeUrl = `${process.env.DASHBOARD_URL || "https://dashboard.apexmedlaw.com"}/api/unsubscribe?email=${encodeURIComponent(payload.to)}&entity=${payload.entity}`;
    const footer = `\n\n---\n${fromName}\nIf you no longer wish to receive these emails, unsubscribe here: ${unsubscribeUrl}`;

    try {
      const result = await resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: [payload.to],
        subject: payload.subject,
        text: payload.body + footer,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
        },
      });

      // Update Notion status to Sent
      await notion.pages.update({
        page_id: payload.notionPageId,
        properties: {
          Status: { select: { name: "Published" } },
        },
      });

      // Add send confirmation as comment
      await notion.comments.create({
        parent: { page_id: payload.notionPageId },
        rich_text: [
          {
            text: {
              content: `Email sent to ${payload.to} on ${new Date().toISOString()}. Resend ID: ${result.data?.id || "unknown"}`,
            },
          },
        ],
      });

      console.log(`Sent marketing email to ${payload.to} for ${payload.entity}`);
      return { status: "sent", to: payload.to, resendId: result.data?.id };
    } catch (err: any) {
      console.error(`Failed to send email to ${payload.to}:`, err.message);

      // Update Notion status to Error
      await notion.pages.update({
        page_id: payload.notionPageId,
        properties: {
          Status: { select: { name: "Error" } },
        },
      });

      return { status: "error", to: payload.to, error: err.message };
    }
  },
});

/**
 * Send all approved but unsent marketing emails in bulk.
 * Rate limited to avoid hitting email provider limits.
 */
export const sendBulkApproved = task({
  id: "marketing-send-bulk-approved",
  maxDuration: 300,
  run: async (payload: {
    entity: string;
    notionPageIds: string[];
  }) => {
    const notion = getNotion();
    const results: { pageId: string; status: string; to?: string; error?: string }[] = [];

    for (const pageId of payload.notionPageIds) {
      try {
        // Read the email content from Notion
        const page = await notion.pages.retrieve({ page_id: pageId }) as any;
        const blocks = await notion.blocks.children.list({ block_id: pageId });

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

        // Parse the email structure from content
        const subjectMatch = content.match(/Subject:\s*(.+)/);
        const toMatch = content.match(/To:\s*(.+)/);
        const emailMatch = content.match(/<([^>]+@[^>]+)>/);

        const subject = subjectMatch?.[1]?.trim() || "Message from " + payload.entity;
        const to = emailMatch?.[1]?.trim();

        if (!to) {
          results.push({ pageId, status: "skipped", error: "No email address found" });
          continue;
        }

        // Extract the email body (everything after "Subject: ..." line)
        const bodyStart = content.indexOf(subject) + subject.length;
        const bodyEnd = content.lastIndexOf("---");
        const body = content
          .slice(bodyStart, bodyEnd > bodyStart ? bodyEnd : undefined)
          .trim();

        // Send with rate limiting (500ms between emails)
        const sendResult = await sendMarketingEmail.triggerAndWait({
          to,
          subject,
          body,
          entity: payload.entity,
          notionPageId: pageId,
        });

        results.push({
          pageId,
          status: sendResult?.status || "unknown",
          to,
          error: sendResult?.error,
        });

        // Rate limit: 500ms between sends
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err: any) {
        results.push({ pageId, status: "error", error: err.message });
      }
    }

    const sent = results.filter((r) => r.status === "sent").length;
    const failed = results.filter((r) => r.status === "error").length;
    console.log(`Bulk send complete: ${sent} sent, ${failed} failed`);

    return { sent, failed, total: results.length, results };
  },
});
