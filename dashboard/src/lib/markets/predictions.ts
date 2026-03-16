// ── AI Prediction Engine ──────────────────────────────────────────
// Claude + Technical Analysis + News Sentiment = Full AI Pipeline

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { analyzeTechnicals } from "./technical";
import { getMarketNews } from "./polygon";
import type { OHLCV, PricePrediction, MarketPrediction, TradeOpportunity, TechnicalAnalysis } from "./types";

const PREDICTION_PROMPT = `You are an elite quantitative analyst and market strategist with decades of experience.
You have access to technical indicators, price data, and recent news for the assets below.

Your job: Provide actionable, data-driven predictions. Be specific with price targets and confidence levels.

IMPORTANT RULES:
- Never give financial advice disclaimers — the user knows the risks
- Be direct and specific with buy/sell/hold recommendations
- Use the technical data to back up every claim
- Assign realistic confidence levels (never above 85% — markets are uncertain)
- Focus on HIGHEST PROBABILITY setups with best RISK/REWARD ratios
- For crypto: factor in 24/7 trading, higher volatility, correlation with BTC
- For stocks: factor in market hours, sector rotation, earnings dates
- Identify the TOP 3 trade opportunities ranked by expected return * probability

Respond ONLY with valid JSON matching this exact schema:
{
  "predictions": [
    {
      "symbol": "string",
      "currentPrice": number,
      "predictions": [
        {
          "timeframe": "1h" | "4h" | "1d" | "1w" | "1m",
          "predictedPrice": number,
          "confidence": number,
          "direction": "up" | "down" | "sideways",
          "percentChange": number
        }
      ],
      "reasoning": "string (2-3 sentences)",
      "riskLevel": "low" | "medium" | "high" | "extreme",
      "sentiment": {
        "overall": number,
        "news": number,
        "social": number,
        "technical": number
      },
      "keyFactors": ["string"]
    }
  ],
  "marketOverview": "string (2-3 sentences about overall market conditions)",
  "topOpportunities": [
    {
      "symbol": "string",
      "name": "string",
      "action": "buy" | "sell" | "hold",
      "confidence": number,
      "entryPrice": number,
      "targetPrice": number,
      "stopLoss": number,
      "riskRewardRatio": number,
      "reasoning": "string",
      "timeframe": "string",
      "potentialReturn": number
    }
  ],
  "warnings": ["string"]
}`;

export async function generatePredictions(
  assets: { symbol: string; name: string; bars: OHLCV[]; technicals: TechnicalAnalysis }[],
): Promise<MarketPrediction> {
  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Gather news for all symbols
  const stockSymbols = assets
    .filter((a) => !a.symbol.includes("/"))
    .map((a) => a.symbol);

  let news: any[] = [];
  try {
    news = await getMarketNews(stockSymbols, 15);
  } catch {
    // News fetch may fail — proceed without it
  }

  // Build context for Claude
  const assetContext = assets.map((a) => {
    const last5 = a.bars.slice(-5);
    const priceHistory = last5.map((b) => ({
      date: new Date(b.timestamp).toISOString().split("T")[0],
      o: b.open.toFixed(2),
      h: b.high.toFixed(2),
      l: b.low.toFixed(2),
      c: b.close.toFixed(2),
      vol: b.volume,
    }));

    return {
      symbol: a.symbol,
      name: a.name,
      currentPrice: a.bars[a.bars.length - 1]?.close || 0,
      recentPrices: priceHistory,
      technicals: {
        overallSignal: a.technicals.overallSignal,
        overallScore: a.technicals.overallScore,
        signals: a.technicals.signals.map((s) => ({
          indicator: s.indicator,
          value: Number(s.value.toFixed(4)),
          signal: s.signal,
          strength: s.strength,
        })),
      },
    };
  });

  const newsContext = news.slice(0, 10).map((n) => ({
    title: n.title,
    tickers: n.tickers,
    sentiment: n.sentiment,
    published: n.publishedUtc,
  }));

  const prompt = `${PREDICTION_PROMPT}

ASSET DATA:
${JSON.stringify(assetContext, null, 2)}

RECENT NEWS:
${JSON.stringify(newsContext, null, 2)}

Current date/time: ${new Date().toISOString()}
Market is ${isMarketHours() ? "OPEN" : "CLOSED"}.

Analyze all assets and return your predictions as JSON.`;

  const { text } = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    prompt,
  } as any);

  // Parse JSON from response (handle markdown code blocks)
  const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      predictions: parsed.predictions || [],
      marketOverview: parsed.marketOverview || "",
      topOpportunities: parsed.topOpportunities || [],
      warnings: parsed.warnings || [],
      generatedAt: Date.now(),
    };
  } catch {
    // If JSON parsing fails, return empty prediction
    return {
      predictions: [],
      marketOverview: "Unable to generate predictions at this time. Please try again.",
      topOpportunities: [],
      warnings: ["AI prediction engine returned invalid data. Retrying may help."],
      generatedAt: Date.now(),
    };
  }
}

function isMarketHours(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  const hour = et.getHours();
  const minute = et.getMinutes();
  const timeNum = hour * 60 + minute;

  // Market hours: Mon-Fri 9:30 AM - 4:00 PM ET
  return day >= 1 && day <= 5 && timeNum >= 570 && timeNum <= 960;
}
