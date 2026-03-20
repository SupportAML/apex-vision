// ── Portfolio API ─────────────────────────────────────────────────
// GET /api/markets/portfolio

import { NextRequest, NextResponse } from "next/server";
import { getAccount, getPortfolioHistory } from "@/lib/markets/alpaca";
import { savePortfolioSnapshot } from "@/lib/markets/firestore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const period = (searchParams.get("period") || "1M") as "1D" | "1W" | "1M" | "3M" | "1A";

    const [account, history] = await Promise.all([
      getAccount(),
      getPortfolioHistory(period),
    ]);

    // Persist portfolio snapshot to Firestore for historical tracking
    try {
      await savePortfolioSnapshot(account);
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ account, history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
