// ── Notifications API ─────────────────────────────────────────────
// GET/POST /api/markets/notifications
// Backed by Firestore for persistent storage across deploys

import { NextRequest, NextResponse } from "next/server";
import {
  saveNotification,
  getUnreadNotifications,
} from "@/lib/markets/firestore";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import type { MarketNotification } from "@/lib/markets/types";

export async function GET() {
  try {
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50),
    );
    const snap = await getDocs(q);
    const notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ notifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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
      await saveNotification(notification);
      return NextResponse.json({ success: true, notification });
    }

    if (action === "markRead") {
      const { id } = body;
      await updateDoc(doc(db, "notifications", id), { read: true });
      return NextResponse.json({ success: true });
    }

    if (action === "markAllRead") {
      const unread = await getUnreadNotifications();
      const batch = writeBatch(db);
      for (const n of unread) {
        batch.update(doc(db, "notifications", (n as any).id || n.id), { read: true });
      }
      await batch.commit();
      return NextResponse.json({ success: true });
    }

    if (action === "clear") {
      // Delete all notifications
      const snap = await getDocs(collection(db, "notifications"));
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
