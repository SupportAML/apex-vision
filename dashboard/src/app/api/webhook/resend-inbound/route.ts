import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";

/**
 * Resend inbound webhook handler.
 * Receives email replies from reviewers and triggers the process-email-reply task.
 *
 * Setup:
 * 1. Go to resend.com → Webhooks → Add webhook
 * 2. Set URL to: https://your-domain.vercel.app/api/webhook/resend-inbound
 * 3. Select event: email.received (inbound)
 * 4. Set TRIGGER_SECRET_KEY in Vercel env vars
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Resend inbound webhook payload structure
    const { from, subject, text, headers } = body.data || body;

    // Extract the review ID we encoded in the outbound email headers
    const reviewId =
      headers?.["x-apex-review-id"] ||
      headers?.["X-Apex-Review-Id"] ||
      extractReviewIdFromSubject(subject);

    if (!reviewId) {
      console.log("Inbound email without review ID, ignoring:", subject);
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    // Decode the reviewId to determine routing
    let reviewMeta: Record<string, string> = {};
    try {
      reviewMeta = JSON.parse(Buffer.from(reviewId, "base64url").toString("utf-8"));
    } catch {
      // Not JSON — treat as legacy review ID
    }

    const fromStr = typeof from === "string" ? from : from?.[0] || "unknown";

    if (reviewMeta.type === "portfolio-feedback") {
      // Route to the portfolio feedback handler
      await tasks.trigger("process-portfolio-feedback", {
        from: fromStr,
        subject: subject || "",
        text: text || "",
      });
      console.log(`Triggered portfolio feedback processing for: ${subject}`);
    } else {
      // Default: route to the content review handler
      await tasks.trigger("process-email-reply", {
        from: fromStr,
        subject: subject || "",
        text: text || "",
        reviewId,
      });
      console.log(`Triggered review processing for: ${subject}`);
    }
    return NextResponse.json({ status: "triggered" }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

/**
 * Fallback: try to extract review ID from the subject line.
 * Resend may not preserve custom headers on inbound replies,
 * so we also encode context in the subject.
 */
function extractReviewIdFromSubject(subject: string): string | null {
  // Subject format: "Re: Review: entity — type/file"
  // We can reconstruct the review context from this
  const match = subject?.match(/Review:\s+(\S+)\s+—\s+(\S+)\/(\S+)/);
  if (!match) return null;

  // Create a review ID on the fly (without notionPageId — poll-notion will handle it)
  return Buffer.from(
    JSON.stringify({
      entity: match[1],
      type: match[2],
      file: match[3],
      notionPageId: "", // Will need to look up
      version: 1,
    })
  ).toString("base64url");
}
