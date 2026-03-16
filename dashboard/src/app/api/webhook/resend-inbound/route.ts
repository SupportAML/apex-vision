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

    // Log the raw body structure so we can debug payload shape
    console.log("INBOUND BODY KEYS:", JSON.stringify(Object.keys(body)));
    console.log("INBOUND BODY.data KEYS:", JSON.stringify(Object.keys(body.data || {})));
    const payload = body.data || body;
    console.log("PAYLOAD text:", JSON.stringify((payload.text || "").slice(0, 200)));
    console.log("PAYLOAD html length:", (payload.html || "").length);

    // Resend inbound webhook payload structure
    const { from, subject, text, html, headers } = payload;

    // Gmail often sends HTML-only replies with no plain text part.
    // Fall back to stripping tags from the HTML body if text is empty.
    const plainText = text?.trim() || stripHtmlTags(html || "");
    console.log("PLAIN TEXT extracted:", JSON.stringify(plainText.slice(0, 200)));

    // Extract the review ID we encoded in the outbound email headers
    const reviewId =
      headers?.["x-apex-review-id"] ||
      headers?.["X-Apex-Review-Id"] ||
      extractReviewIdFromSubject(subject);

    // Fallback: detect known subjects when header is stripped by email client
    const subjectLower = (subject || "").toLowerCase();
    const inferredType =
      !reviewId && subjectLower.includes("apex vision portfolio")
        ? "portfolio-feedback"
        : null;

    if (!reviewId && !inferredType) {
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

    if (reviewMeta.type === "portfolio-feedback" || inferredType === "portfolio-feedback") {
      // Route to the portfolio feedback handler
      await tasks.trigger("process-portfolio-feedback", {
        from: fromStr,
        subject: subject || "",
        text: plainText,
      });
      console.log(`Triggered portfolio feedback processing for: ${subject}`);
    } else {
      // Default: route to the content review handler
      await tasks.trigger("process-email-reply", {
        from: fromStr,
        subject: subject || "",
        text: plainText,
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

/** Strip HTML tags to get plain text from an HTML email body. */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim();
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
