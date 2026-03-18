import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";

const UNSUBSCRIBE_SECRET =
  process.env.UNSUBSCRIBE_SECRET || "days-inn-unsub-2026";

// Trigger.dev API for firing the unsubscribe task
const TRIGGER_API_URL =
  process.env.TRIGGER_API_URL || "https://api.trigger.dev";
const TRIGGER_SECRET_KEY = process.env.TRIGGER_SECRET_KEY || "";

function decodeToken(token: string): string | null {
  try {
    const decoded = JSON.parse(
      Buffer.from(token, "base64url").toString("utf-8")
    );
    const hmac = crypto.createHmac("sha256", UNSUBSCRIBE_SECRET);
    hmac.update(decoded.e);
    const expected = hmac.digest("hex").slice(0, 16);
    if (decoded.s === expected) return decoded.e;
    return null;
  } catch {
    return null;
  }
}

async function triggerUnsubscribe(email: string): Promise<void> {
  // Fire-and-forget: trigger a task that updates the contacts JSON
  // The Trigger.dev worker has filesystem access
  if (!TRIGGER_SECRET_KEY) {
    console.warn("No TRIGGER_SECRET_KEY -- unsubscribe not persisted to contacts DB");
    return;
  }

  try {
    await fetch(`${TRIGGER_API_URL}/api/v1/tasks/days-inn-unsubscribe/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TRIGGER_SECRET_KEY}`,
      },
      body: JSON.stringify({ payload: { email } }),
    });
  } catch (err) {
    console.error("Failed to trigger unsubscribe task:", err);
  }
}

// GET /api/unsubscribe?token=xxx
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Missing token", { status: 400 });
  }

  const email = decodeToken(token);
  if (!email) {
    return new NextResponse("Invalid or expired link", { status: 400 });
  }

  // Fire async task to update contacts DB (don't await -- show page immediately)
  triggerUnsubscribe(email);

  const html = `<!DOCTYPE html>
<html>
<head><title>Unsubscribed</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:-apple-system,system-ui,sans-serif;max-width:500px;margin:60px auto;padding:20px;text-align:center;">
  <h1 style="font-size:24px;color:#1a365d;">You've been unsubscribed</h1>
  <p style="color:#64748b;line-height:1.6;">You won't receive any more emails from Days Inn Cambridge about contractor lodging.</p>
  <p style="color:#94a3b8;font-size:13px;margin-top:24px;">Days Inn by Wyndham Cambridge<br/>2328 Southgate Parkway, Cambridge, OH 43725<br/>740-432-5691</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}

// POST /api/unsubscribe (for List-Unsubscribe-Post one-click)
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const email = decodeToken(token);
  if (!email) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  await triggerUnsubscribe(email);
  return NextResponse.json({ unsubscribed: true });
}
