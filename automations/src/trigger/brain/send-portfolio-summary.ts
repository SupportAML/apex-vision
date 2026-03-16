import { task } from "@trigger.dev/sdk";
import { getResend, REVIEW_FROM_EMAIL } from "../outputs/config.js";
import { buildPortfolioSummaryHtml, PORTFOLIO_SUMMARY_VERSION } from "./portfolio-summary-content.js";

// Stable review ID for the portfolio feedback loop
export const PORTFOLIO_FEEDBACK_REVIEW_ID = Buffer.from(
  JSON.stringify({ type: "portfolio-feedback" })
).toString("base64url");

export const sendPortfolioSummary = task({
  id: "send-portfolio-summary",
  run: async (_payload: Record<string, never>) => {
    const resend = getResend();
    const toEmail = "ahkapuria@gmail.com";
    const subject = `Apex Vision Portfolio — ${PORTFOLIO_SUMMARY_VERSION}`;

    const result = await resend.emails.send({
      from: REVIEW_FROM_EMAIL,
      to: [toEmail],
      subject,
      headers: {
        // Used by the inbound webhook to route replies back to the feedback handler
        "X-Apex-Review-Id": PORTFOLIO_FEEDBACK_REVIEW_ID,
      },
      html: buildPortfolioSummaryHtml(),
    });

    if (result.error) {
      console.error("Resend error:", JSON.stringify(result.error));
      return { sent: false, error: result.error };
    }

    console.log(`Portfolio summary sent to ${toEmail} (id: ${result.data?.id})`);
    return { sent: true, emailId: result.data?.id, subject };
  },
});
