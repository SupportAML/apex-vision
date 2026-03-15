import { task } from "@trigger.dev/sdk";
import {
  getResend,
  getReviewers,
  readOutput,
  REVIEW_FROM_EMAIL,
} from "./config.js";
import { marked } from "marked";

/**
 * Send a review email to entity reviewers with the output content inline.
 * Reply-to is the Resend inbound webhook address so replies trigger process-email-reply.
 */
export const sendReviewEmail = task({
  id: "send-review-email",
  run: async (payload: {
    entitySlug: string;
    outputType: string;
    fileName: string;
    notionPageId: string;
    version?: number;
  }) => {
    const resend = getResend();
    const reviewers = await getReviewers(payload.entitySlug);
    const version = payload.version || 1;

    if (reviewers.length === 0) {
      console.log(`No reviewers configured for ${payload.entitySlug}`);
      return { sent: false, reason: "no_reviewers" };
    }

    const content = await readOutput(
      payload.entitySlug,
      payload.outputType,
      payload.fileName
    );

    const versionLabel = version > 1 ? ` (v${version})` : "";
    const subject = `Review: ${payload.entitySlug} — ${payload.outputType}/${payload.fileName}${versionLabel}`;

    // Encode metadata in a reply identifier so we can parse it from inbound webhook
    const replyId = Buffer.from(
      JSON.stringify({
        entity: payload.entitySlug,
        type: payload.outputType,
        file: payload.fileName,
        notionPageId: payload.notionPageId,
        version,
      })
    ).toString("base64url");

    const result = await resend.emails.send({
      from: REVIEW_FROM_EMAIL,
      to: reviewers,
      subject,
      headers: {
        "X-Apex-Review-Id": replyId,
      },
      html: `
        <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 700px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>${payload.entitySlug}</strong> &middot; ${payload.outputType} &middot; v${version}
            </p>
            <p style="margin: 8px 0 0; color: #999; font-size: 13px;">
              Reply to this email with feedback, or reply <strong>"Approved"</strong> to publish.
            </p>
          </div>
          <div style="font-size: 14px; line-height: 1.6;">
${renderMarkdown(content)}
          </div>
          <style>
            table { border-collapse: collapse; width: 100%; margin: 16px 0; }
            th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #f4f4f5; font-weight: 600; }
            tr:nth-child(even) { background: #fafafa; }
            h1, h2, h3 { color: #111; margin-top: 24px; }
            h2 { font-size: 18px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
            ul, ol { padding-left: 20px; }
            strong { color: #333; }
          </style>
          <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            <p>Reply "Approved" to publish. Any other reply will be treated as revision feedback.</p>
          </div>
        </div>
      `,
    });

    if (result.error) {
      console.error(`Resend error:`, JSON.stringify(result.error));
      return { sent: false, error: result.error, reviewers, subject };
    }

    console.log(`Sent review email to ${reviewers.length} reviewers for ${subject}`);
    return { sent: true, emailId: result.data?.id, reviewers, subject };
  },
});

function renderMarkdown(text: string): string {
  return marked.parse(text, { async: false }) as string;
}
