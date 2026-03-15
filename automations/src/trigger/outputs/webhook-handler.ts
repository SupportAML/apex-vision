import { task } from "@trigger.dev/sdk";
import { processEmailReply } from "./process-email-reply.js";

/**
 * Webhook handler for Resend inbound emails.
 *
 * To set this up, you need a small API endpoint (e.g. Next.js API route,
 * Express server, or Vercel serverless function) that:
 *
 * 1. Receives POST from Resend inbound webhook
 * 2. Extracts the review ID from email headers (X-Apex-Review-Id)
 * 3. Calls: await tasks.trigger("process-email-reply", { ... })
 *
 * Example Vercel serverless function (api/webhook/resend-inbound.ts):
 *
 * ```typescript
 * import { tasks } from "@trigger.dev/sdk/v3";
 *
 * export async function POST(req: Request) {
 *   const body = await req.json();
 *   const { from, subject, text, headers } = body;
 *
 *   // Extract review ID from headers
 *   const reviewId = headers?.["x-apex-review-id"] || "";
 *   if (!reviewId) {
 *     return new Response("No review ID", { status: 400 });
 *   }
 *
 *   await tasks.trigger("process-email-reply", {
 *     from,
 *     subject,
 *     text,
 *     reviewId,
 *   });
 *
 *   return new Response("OK", { status: 200 });
 * }
 * ```
 *
 * Point Resend inbound webhook to: https://your-domain.com/api/webhook/resend-inbound
 */

// This file is documentation only. The actual webhook handler
// lives in your web app (dashboard or a separate API).
