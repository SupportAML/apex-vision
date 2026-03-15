import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@trigger.dev/sdk/v3";

/**
 * Notion Automation webhook for content review actions.
 * Fires when a reviewer changes Status on a content page in the
 * Apex Outputs Notion database.
 *
 * Setup in Notion:
 * 1. Open the Apex Outputs database → Automations
 * 2. Add trigger: "When Status changes to Approved"
 *    → Action: Send webhook to https://your-domain.vercel.app/api/webhook/notion-review
 * 3. Add trigger: "When Status changes to Revision"
 *    → Action: Send webhook to https://your-domain.vercel.app/api/webhook/notion-review
 * 4. Add trigger: "When Status changes to Rejected"
 *    → Action: Send webhook to https://your-domain.vercel.app/api/webhook/notion-review
 *
 * Each automation should include ?secret=YOUR_SECRET in the URL if NOTION_WEBHOOK_SECRET is set.
 */

const WEBHOOK_SECRET = process.env.NOTION_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    if (WEBHOOK_SECRET) {
      const authHeader = req.headers.get("authorization");
      const querySecret = req.nextUrl.searchParams.get("secret");
      const provided = authHeader?.replace("Bearer ", "") || querySecret;
      if (provided !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const pageId = body.data?.page_id || body.page_id;

    if (!pageId) {
      return NextResponse.json({ error: "Missing page_id" }, { status: 400 });
    }

    await tasks.trigger("process-notion-review", { pageId });

    console.log(`Triggered process-notion-review for page: ${pageId}`);
    return NextResponse.json({ status: "triggered", pageId }, { status: 200 });
  } catch (error) {
    console.error("Notion review webhook error:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
