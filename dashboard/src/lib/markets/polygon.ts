// ── Polygon.io Market Data Client ─────────────────────────────────
// Uses free-tier endpoints: /prev (previous day close) and /range (historical bars)
// Snapshot endpoints require a paid plan and are NOT used.

import type { MarketQuote, OHLCV, CryptoQuote } from "./types";

const POLYGON_BASE = "https://api.polygon.io";

function getApiKey(): string {
  const key = process.env.POLYGON_API_KEY;
  if (!key) throw new Error("POLYGON_API_KEY not configured");
  return key;
}

async function polygonFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${POLYGON_BASE}${path}`);
  url.searchParams.set("apiKey", getApiKey());
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), { next: { revalidate: 30 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Polygon API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Stock Quotes (free-tier: previous day close) ─────────────────

async function getStockPrev(symbol: string): Promise<any> {
  const data = await polygonFetch<any>(`/v2/aggs/ticker/${symbol}/prev`, {
    adjusted: "true",
  });
  return data.results?.[0] || null;
}

export async function getStockSnapshot(symbol: string): Promise<MarketQuote> {
  const bar = await getStockPrev(symbol);
  if (!bar) throw new Error(`No data for ${symbol}`);

  return {
    symbol,
    name: symbol,
    price: bar.c || 0,
    change: bar.c && bar.o ? bar.c - bar.o : 0,
    changePercent: bar.c && bar.o ? ((bar.c - bar.o) / bar.o) * 100 : 0,
    high: bar.h || 0,
    low: bar.l || 0,
    open: bar.o || 0,
    prevClose: bar.o || 0,
    volume: bar.v || 0,
    timestamp: bar.t || Date.now(),
  };
}

export async function getMultipleStockSnapshots(symbols: string[]): Promise<MarketQuote[]> {
  // Free tier doesn't have batch snapshot — fetch individually with concurrency
  const results = await Promise.allSettled(
    symbols.map((sym) => getStockSnapshot(sym))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<MarketQuote> => r.status === "fulfilled")
    .map((r) => r.value);
}

// ── Historical Data (OHLCV) ──────────────────────────────────────

export async function getStockBars(
  symbol: string,
  timespan: "minute" | "hour" | "day" | "week" | "month" = "day",
  from: string, // YYYY-MM-DD
  to: string,
  multiplier = 1,
): Promise<OHLCV[]> {
  const data = await polygonFetch<any>(
    `/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}`,
    { adjusted: "true", sort: "asc", limit: "5000" }
  );

  return (data.results || []).map((bar: any) => ({
    timestamp: bar.t,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  }));
}

// ── Crypto ────────────────────────────────────────────────────────

export async function getCryptoSnapshot(symbol: string): Promise<CryptoQuote> {
  const polygonSymbol = `X:${symbol.replace("/", "")}`;
  const data = await polygonFetch<any>(`/v2/aggs/ticker/${polygonSymbol}/prev`, {
    adjusted: "true",
  });
  const bar = data.results?.[0];
  if (!bar) throw new Error(`No data for ${symbol}`);

  return {
    symbol,
    name: symbol,
    price: bar.c || 0,
    change: bar.c && bar.o ? bar.c - bar.o : 0,
    changePercent: bar.c && bar.o ? ((bar.c - bar.o) / bar.o) * 100 : 0,
    high: bar.h || 0,
    low: bar.l || 0,
    open: bar.o || 0,
    prevClose: bar.o || 0,
    volume: bar.v || 0,
    timestamp: bar.t || Date.now(),
  };
}

export async function getCryptoBars(
  symbol: string,
  timespan: "minute" | "hour" | "day" | "week" | "month" = "day",
  from: string,
  to: string,
  multiplier = 1,
): Promise<OHLCV[]> {
  const polygonSymbol = `X:${symbol.replace("/", "")}`;
  const data = await polygonFetch<any>(
    `/v2/aggs/ticker/${polygonSymbol}/range/${multiplier}/${timespan}/${from}/${to}`,
    { adjusted: "true", sort: "asc", limit: "5000" }
  );

  return (data.results || []).map((bar: any) => ({
    timestamp: bar.t,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    close: bar.c,
    volume: bar.v,
  }));
}

// ── News & Sentiment ──────────────────────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  publishedUtc: string;
  articleUrl: string;
  publisher: { name: string };
  tickers: string[];
  sentiment?: "positive" | "negative" | "neutral";
}

export async function getMarketNews(symbols?: string[], limit = 20): Promise<NewsArticle[]> {
  const params: Record<string, string> = {
    limit: limit.toString(),
    order: "desc",
    sort: "published_utc",
  };
  if (symbols?.length) {
    params["ticker"] = symbols.join(",");
  }

  const data = await polygonFetch<any>(`/v2/reference/news`, params);
  return (data.results || []).map((a: any) => ({
    id: a.id,
    title: a.title,
    description: a.description || "",
    publishedUtc: a.published_utc,
    articleUrl: a.article_url,
    publisher: { name: a.publisher?.name || "Unknown" },
    tickers: a.tickers || [],
    sentiment: a.insights?.[0]?.sentiment,
  }));
}

// ── Market Status ─────────────────────────────────────────────────

export async function getMarketStatus(): Promise<{
  market: string;
  serverTime: string;
  exchanges: Record<string, string>;
}> {
  return polygonFetch(`/v1/marketstatus/now`);
}
