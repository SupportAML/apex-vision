// ── Notifications API ─────────────────────────────────────────────
// GET/POST /api/markets/notifications

import { NextRequest, NextResponse } from "next/server";
import type { MarketNotification } from "@/lib/markets/types";

// In-memory store (in production, use a database)
let notifications: MarketNotification[] = [];

export async function GET() {
  return NextResponse.json({ notifications: notifications.slice(0, 50) });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "add") {
      const notification: MarketNotification = {
        id: crypto.randomUUID(),
        type: body.type || "alert",
        title: body.title,
        message: body.message,
        symbol: body.symbol,
        action: body.tradeAction,
        urgency: body.urgency || "medium",
        read: false,
        createdAt: Date.now(),
      };
      notifications.unshift(notification);
      // Keep max 100 notifications
      if (notifications.length > 100) notifications = notifications.slice(0, 100);
      return NextResponse.json({ success: true, notification });
    }

    if (action === "markRead") {
      const { id } = body;
      const notif = notifications.find((n) => n.id === id);
      if (notif) notif.read = true;
      return NextResponse.json({ success: true });
    }

    if (action === "markAllRead") {
      notifications.forEach((n) => (n.read = true));
      return NextResponse.json({ success: true });
    }

    if (action === "clear") {
      notifications = [];
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
