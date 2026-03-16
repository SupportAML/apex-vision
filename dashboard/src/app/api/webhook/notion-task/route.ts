import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";

/**
 * Notion Automation webhook handler.
 * Receives webhooks from Notion Automations when a task page's status
 * changes to "Ready for AI", then triggers the process-notion-task job.
 *
 * Setup in Notion:
 * 1. Open your Tasks database → Automations
 * 2. Add trigger: "When Status changes to Ready for AI"
 * 3. Add action: "Send webhook"
 * 4. URL: https://your-domain.vercel.app/api/webhook/notion-task
 * 5. Set NOTION_WEBHOOK_SECRET in Vercel env vars (optional but recommended)
 *
 * Expected payload from Notion Automations webhook:
 * {
 *   "source": { "type": "automation" },
 *   "data": {
 *     "page_id": "...",
 *     "properties": { ... }
 *   }
 * }
 */

const WEBHOOK_SECRET = process.env.NOTION_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Optional: verify webhook secret via query param or header
    if (WEBHOOK_SECRET) {
      const authHeader = req.headers.get("authorization");
      const querySecret = req.nextUrl.searchParams.get("secret");
      const provided = authHeader?.replace("Bearer ", "") || querySecret;

      if (provided !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();

    // Notion Automations webhook sends page data in body.data
    // Support both direct page_id and nested data structure
    const pageId = body.data?.page_id || body.page_id;

    if (!pageId) {
      console.log("Notion webhook: no page_id found in payload", body);
      return NextResponse.json(
        { error: "Missing page_id" },
        { status: 400 }
      );
    }

    // Trigger the Trigger.dev task
    await tasks.trigger("process-notion-task", { pageId });

    console.log(`Triggered process-notion-task for page: ${pageId}`);
    return NextResponse.json({ status: "triggered", pageId }, { status: 200 });
  } catch (error) {
    console.error("Notion webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
