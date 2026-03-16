import { Resend } from "resend";
import { buildPortfolioSummaryHtml, PORTFOLIO_SUMMARY_VERSION } from "./src/trigger/brain/portfolio-summary-content.js";

async function main() {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const fromEmail = process.env.REVIEW_FROM_EMAIL || "review@updates.apexmedlaw.com";
  const reviewId = Buffer.from(JSON.stringify({ type: "portfolio-feedback" })).toString("base64url");

  const result = await resend.emails.send({
    from: fromEmail,
    to: ["ahkapuria@gmail.com"],
    subject: `Apex Vision Portfolio — ${PORTFOLIO_SUMMARY_VERSION}`,
    headers: { "X-Apex-Review-Id": reviewId },
    html: buildPortfolioSummaryHtml(),
  });

  if (result.error) {
    console.error("Error:", JSON.stringify(result.error, null, 2));
    process.exit(1);
  }

  console.log("Sent! Email ID:", result.data?.id);
}

main().catch((e) => { console.error(e); process.exit(1); });
