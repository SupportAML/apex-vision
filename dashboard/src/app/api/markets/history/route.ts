// ── Prediction & Trade History API ───────────────────────────────
// GET /api/markets/history?type=predictions|trades|portfolio&symbol=AAPL&limit=20

import { NextRequest, NextResponse } from "next/server";
import {
  getLatestPrediction,
  getPredictionHistory,
  getTradeHistory,
  getPortfolioHistory,
} from "@/lib/markets/firestore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type") || "predictions";
    const symbol = searchParams.get("symbol") || undefined;
    const maxResults = parseInt(searchParams.get("limit") || "20");

    switch (type) {
      case "predictions": {
        if (symbol) {
          const history = await getPredictionHistory(symbol, maxResults);
          return NextResponse.json({ symbol, predictions: history });
        }
        const latest = await getLatestPrediction();
        return NextResponse.json({ latest });
      }

      case "trades": {
        const trades = await getTradeHistory(symbol, maxResults);
        return NextResponse.json({ trades });
      }

      case "portfolio": {
        const snapshots = await getPortfolioHistory(maxResults);
        return NextResponse.json({ snapshots });
      }

      default:
        return NextResponse.json({ error: "Invalid type. Use: predictions, trades, portfolio" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
