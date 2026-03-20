// ── Trade Execution API ───────────────────────────────────────────
// POST /api/markets/trade { action: "submit" | "cancel", order: {...} }

import { NextRequest, NextResponse } from "next/server";
import { submitOrder, cancelOrder, getOrders } from "@/lib/markets/alpaca";
import { saveTrade } from "@/lib/markets/firestore";
import type { TradeOrder } from "@/lib/markets/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "submit") {
      const order: TradeOrder = body.order;
      if (!order.symbol || !order.side || !order.qty) {
        return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
      }

      const result = await submitOrder(order);

      // Persist trade to Firestore for history tracking
      try {
        await saveTrade(result);
      } catch {
        // Non-blocking — trade still executed even if persistence fails
      }

      return NextResponse.json({ success: true, order: result });
    }

    if (action === "cancel") {
      const { orderId } = body;
      if (!orderId) {
        return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
      }
      await cancelOrder(orderId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = (searchParams.get("status") || "all") as "open" | "closed" | "all";
    const orders = await getOrders(status);
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
