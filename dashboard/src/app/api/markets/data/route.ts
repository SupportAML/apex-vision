// ── Market Data API ───────────────────────────────────────────────
// GET /api/markets/data?symbols=AAPL,MSFT&type=stock

import { NextRequest, NextResponse } from "next/server";
import { getMultipleStockSnapshots, getCryptoSnapshot, getStockBars, getCryptoBars } from "@/lib/markets/polygon";
import { analyzeTechnicals } from "@/lib/markets/technical";
import { DEFAULT_STOCKS, DEFAULT_CRYPTO } from "@/lib/markets/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type") || "all";
    const symbolsParam = searchParams.get("symbols");
    const period = searchParams.get("period") || "30"; // days of historical data

    const toDate = new Date().toISOString().split("T")[0];
    const fromDate = new Date(Date.now() - parseInt(period) * 86400000).toISOString().split("T")[0];

    const result: any = { stocks: [], crypto: [], technicals: {} };

    // Fetch stock data
    if (type === "all" || type === "stock") {
      const stockSymbols = symbolsParam
        ? symbolsParam.split(",").filter((s) => !s.includes("/"))
        : DEFAULT_STOCKS.map((s) => s.symbol);

      try {
        result.stocks = await getMultipleStockSnapshots(stockSymbols);

        // Add names from defaults
        result.stocks = result.stocks.map((q: any) => ({
          ...q,
          name: DEFAULT_STOCKS.find((s) => s.symbol === q.symbol)?.name || q.symbol,
        }));
      } catch (e: any) {
        result.stockError = e.message;
      }
    }

    // Fetch crypto data
    if (type === "all" || type === "crypto") {
      const cryptoSymbols = symbolsParam
        ? symbolsParam.split(",").filter((s) => s.includes("/"))
        : DEFAULT_CRYPTO.map((s) => s.symbol);

      const cryptoPromises = cryptoSymbols.map(async (sym) => {
        try {
          const quote = await getCryptoSnapshot(sym);
          return {
            ...quote,
            name: DEFAULT_CRYPTO.find((s) => s.symbol === sym)?.name || sym,
          };
        } catch {
          return null;
        }
      });

      result.crypto = (await Promise.all(cryptoPromises)).filter(Boolean);
    }

    // Fetch technical analysis for top movers
    const allSymbols = [
      ...result.stocks.map((s: any) => s.symbol),
      ...result.crypto.map((c: any) => c.symbol),
    ].slice(0, 5);

    const technicalPromises = allSymbols.map(async (sym: string) => {
      try {
        const isCrypto = sym.includes("/");
        const bars = isCrypto
          ? await getCryptoBars(sym, "day", fromDate, toDate)
          : await getStockBars(sym, "day", fromDate, toDate);

        if (bars.length > 10) {
          return { symbol: sym, analysis: analyzeTechnicals(sym, bars) };
        }
      } catch {
        return null;
      }
    });

    const technicalResults = (await Promise.all(technicalPromises)).filter(Boolean);
    for (const t of technicalResults) {
      if (t) result.technicals[t.symbol] = t.analysis;
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
