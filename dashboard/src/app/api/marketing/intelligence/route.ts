import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/marketing/intelligence
 * Handle intelligence actions: incorporate a finding into the learning system.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, finding } = body;

    if (action === "incorporate" && finding) {
      // Trigger the intelligence evaluator via Trigger.dev
      try {
        await fetch(`${process.env.TRIGGER_API_URL || ""}/api/trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskId: "marketing-intelligence-evaluator",
            payload: {
              finding,
              targetEntities: finding.relevantEntities || [],
            },
          }),
        });
      } catch (err) {
        console.error("Failed to trigger intelligence evaluator:", err);
      }

      return NextResponse.json({
        status: "evaluating",
        title: finding.title,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("Intelligence action error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process intelligence action" },
      { status: 500 }
    );
  }
}
