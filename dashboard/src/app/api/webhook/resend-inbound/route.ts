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

    const payload = body.data || body;
    const { from, subject, text, html, headers } = payload;

    // headers is an array of {name, value} objects in Resend's inbound format
    let reviewId: string | null = null;
    let contactId: string | null = null;

    if (Array.isArray(headers)) {
      const reviewHeader = (headers as { name: string; value: string }[]).find(
        (h) => h.name.toLowerCase() === "x-apex-review-id"
      );
      reviewId = reviewHeader?.value || null;

      const contactHeader = (headers as { name: string; value: string }[]).find(
        (h) => h.name.toLowerCase() === "x-apex-contact-id"
      );
      contactId = contactHeader?.value || null;
    } else {
      reviewId = headers?.["x-apex-review-id"] || headers?.["X-Apex-Review-Id"] || null;
      contactId = headers?.["x-apex-contact-id"] || headers?.["X-Apex-Contact-Id"] || null;
    }

    // Extract just the new reply text — strip the quoted thread before processing.
    // Apple Mail sends HTML-only replies; the quoted original email is in a <blockquote>.
    let feedbackText = text?.trim() || "";
    if (!feedbackText) {
      const htmlNoQuotes = (html || "").replace(/<blockquote[\s\S]*?<\/blockquote>/gi, "");
      feedbackText = stripHtmlTags(htmlNoQuotes);
    } else {
      // Strip >-quoted lines from plain text replies
      feedbackText = feedbackText.split("\n").filter((l: string) => !l.trimStart().startsWith(">")).join("\n").trim();
    }

    // Also detect contractor lead replies by subject pattern
    if (!contactId) {
      const subjectStr = (subject || "").toLowerCase();
      if (
        subjectStr.includes("crew lodging") ||
        subjectStr.includes("days inn") ||
        subjectStr.includes("crew rates") ||
        subjectStr.includes("contractor")
      ) {
        contactId = "subject-match"; // Flag for contractor lead reply
      }
    }

    // --- Route: Contractor lead reply ---
    if (contactId) {
      const fromStr = typeof from === "string" ? from : from?.[0] || "unknown";
      await tasks.trigger("days-inn-handle-reply", {
        from: fromStr,
        subject: subject || "",
        text: feedbackText || text || "",
        contactId,
      });
      console.log(`Triggered contractor reply handler for: ${fromStr} (contact: ${contactId})`);
      return NextResponse.json({ status: "contractor-reply-triggered" }, { status: 200 });
    }

    reviewId = reviewId || extractReviewIdFromSubject(subject);

    console.log("DEBUG", JSON.stringify({
      textLen: (text || "").length,
      htmlLen: (html || "").length,
      feedbackPreview: feedbackText.slice(0, 200),
    }));

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
      reviewMeta = JSON.parse(Buffer.from(reviewId ?? "", "base64url").toString("utf-8"));
    } catch {
      // Not JSON — treat as legacy review ID
    }

    const fromStr = typeof from === "string" ? from : from?.[0] || "unknown";

    if (reviewMeta.type === "portfolio-feedback" || inferredType === "portfolio-feedback") {
      // Route to the portfolio feedback handler
      await tasks.trigger("process-portfolio-feedback", {
        from: fromStr,
        subject: subject || "",
        text: feedbackText,
      });
      console.log(`Triggered portfolio feedback processing for: ${subject}`);
    } else {
      // Default: route to the content review handler
      await tasks.trigger("process-email-reply", {
        from: fromStr,
        subject: subject || "",
        text: feedbackText,
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
