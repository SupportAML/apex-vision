// ── AI Prediction API ─────────────────────────────────────────────
// POST /api/markets/predict { symbols: ["AAPL", "BTC/USD"] }

import { NextRequest, NextResponse } from "next/server";
import { getStockBars, getCryptoBars } from "@/lib/markets/polygon";
import { analyzeTechnicals } from "@/lib/markets/technical";
import { generatePredictions } from "@/lib/markets/predictions";
import { DEFAULT_STOCKS, DEFAULT_CRYPTO } from "@/lib/markets/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const symbols: string[] = body.symbols || [
      ...DEFAULT_STOCKS.slice(0, 5).map((s) => s.symbol),
      ...DEFAULT_CRYPTO.slice(0, 2).map((s) => s.symbol),
    ];

    const toDate = new Date().toISOString().split("T")[0];
    const fromDate = new Date(Date.now() - 60 * 86400000).toISOString().split("T")[0];

    // Fetch historical data and compute technicals for each symbol
    const assets = await Promise.all(
      symbols.map(async (symbol) => {
        const isCrypto = symbol.includes("/");
        const name = isCrypto
          ? DEFAULT_CRYPTO.find((c) => c.symbol === symbol)?.name || symbol
          : DEFAULT_STOCKS.find((s) => s.symbol === symbol)?.name || symbol;

        try {
          const bars = isCrypto
            ? await getCryptoBars(symbol, "day", fromDate, toDate)
            : await getStockBars(symbol, "day", fromDate, toDate);

          const technicals = bars.length > 10
            ? analyzeTechnicals(symbol, bars)
            : { symbol, signals: [], overallSignal: "neutral" as const, overallScore: 0, timestamp: Date.now() };

          return { symbol, name, bars, technicals };
        } catch {
          return {
            symbol,
            name,
            bars: [],
            technicals: { symbol, signals: [], overallSignal: "neutral" as const, overallScore: 0, timestamp: Date.now() },
          };
        }
      })
    );

    const validAssets = assets.filter((a) => a.bars.length > 0);

    if (validAssets.length === 0) {
      return NextResponse.json({
        error: "No market data available. Check POLYGON_API_KEY configuration.",
      }, { status: 400 });
    }

    const predictions = await generatePredictions(validAssets);
    return NextResponse.json(predictions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
