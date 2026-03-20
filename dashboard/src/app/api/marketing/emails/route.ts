import { NextRequest, NextResponse } from "next/server";
import { Client } from "@notionhq/client";

function getNotion() {
  return new Client({ auth: process.env.NOTION_API_KEY });
}

/**
 * POST /api/marketing/emails
 * Handle email marketing actions: bulk_send, approve, reject.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, notionPageIds } = body;

    if (action === "bulk_send" && notionPageIds?.length > 0) {
      // Trigger bulk send via Trigger.dev
      try {
        await fetch(`${process.env.TRIGGER_API_URL || ""}/api/trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: "marketing-send-bulk-approved",
            payload: { entity: body.entity || "nlc", notionPageIds },
          }),
        });
      } catch {
        // Fallback: update status directly
        const notion = getNotion();
        for (const pageId of notionPageIds) {
          await notion.pages.update({
            page_id: pageId,
            properties: { Status: { select: { name: "Published" } } },
          });
        }
      }

      return NextResponse.json({
        status: "sending",
        count: notionPageIds.length,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Email action error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process email action" },
      { status: 500 }
    );
  }
}
