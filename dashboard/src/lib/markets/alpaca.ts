// ── Alpaca Trading Client ─────────────────────────────────────────
// Paper trading + live trading via Alpaca API

import type { TradeOrder, Position, PortfolioSummary } from "./types";

// Paper trading uses a different base URL
function getBaseUrl(): string {
  const isLive = process.env.ALPACA_LIVE === "true";
  return isLive
    ? "https://api.alpaca.markets"
    : "https://paper-api.alpaca.markets";
}

function getHeaders(): Record<string, string> {
  const key = process.env.ALPACA_API_KEY;
  const secret = process.env.ALPACA_API_SECRET;
  if (!key || !secret) throw new Error("ALPACA_API_KEY and ALPACA_API_SECRET not configured");

  return {
    "APCA-API-KEY-ID": key,
    "APCA-API-SECRET-KEY": secret,
    "Content-Type": "application/json",
  };
}

async function alpacaFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Alpaca API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ── Account ───────────────────────────────────────────────────────

export async function getAccount(): Promise<PortfolioSummary> {
  const account = await alpacaFetch<any>("/v2/account");
  const positions = await getPositions();

  const equity = parseFloat(account.equity);
  const lastEquity = parseFloat(account.last_equity);
  const dayPL = equity - lastEquity;

  return {
    equity,
    cash: parseFloat(account.cash),
    buyingPower: parseFloat(account.buying_power),
    portfolioValue: parseFloat(account.portfolio_value),
    dayPL,
    dayPLPercent: lastEquity > 0 ? (dayPL / lastEquity) * 100 : 0,
    totalPL: equity - 100000, // Assuming $100k starting paper balance
    totalPLPercent: ((equity - 100000) / 100000) * 100,
    positions,
    lastUpdated: Date.now(),
  };
}

// ── Positions ─────────────────────────────────────────────────────

export async function getPositions(): Promise<Position[]> {
  const positions = await alpacaFetch<any[]>("/v2/positions");

  return positions.map((p) => ({
    symbol: p.symbol,
    name: p.symbol,
    qty: parseFloat(p.qty),
    avgEntryPrice: parseFloat(p.avg_entry_price),
    currentPrice: parseFloat(p.current_price),
    marketValue: parseFloat(p.market_value),
    unrealizedPL: parseFloat(p.unrealized_pl),
    unrealizedPLPercent: parseFloat(p.unrealized_plpc) * 100,
    side: parseFloat(p.qty) > 0 ? "long" : "short",
  }));
}

// ── Orders ────────────────────────────────────────────────────────

export async function submitOrder(order: TradeOrder): Promise<TradeOrder> {
  const body: any = {
    symbol: order.symbol,
    qty: order.qty.toString(),
    side: order.side,
    type: order.type,
    time_in_force: order.timeInForce,
  };

  if (order.limitPrice) body.limit_price = order.limitPrice.toString();
  if (order.stopPrice) body.stop_price = order.stopPrice.toString();

  const result = await alpacaFetch<any>("/v2/orders", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    id: result.id,
    symbol: result.symbol,
    side: result.side,
    type: result.type,
    qty: parseFloat(result.qty),
    limitPrice: result.limit_price ? parseFloat(result.limit_price) : undefined,
    stopPrice: result.stop_price ? parseFloat(result.stop_price) : undefined,
    timeInForce: result.time_in_force,
    status: result.status === "accepted" ? "submitted" : result.status,
    filledAt: result.filled_at,
    filledPrice: result.filled_avg_price ? parseFloat(result.filled_avg_price) : undefined,
    createdAt: result.created_at,
  };
}

export async function getOrders(status: "open" | "closed" | "all" = "all", limit = 50): Promise<TradeOrder[]> {
  const orders = await alpacaFetch<any[]>(`/v2/orders?status=${status}&limit=${limit}&direction=desc`);

  return orders.map((o) => ({
    id: o.id,
    symbol: o.symbol,
    side: o.side,
    type: o.type,
    qty: parseFloat(o.qty),
    limitPrice: o.limit_price ? parseFloat(o.limit_price) : undefined,
    stopPrice: o.stop_price ? parseFloat(o.stop_price) : undefined,
    timeInForce: o.time_in_force,
    status: o.status,
    filledAt: o.filled_at,
    filledPrice: o.filled_avg_price ? parseFloat(o.filled_avg_price) : undefined,
    createdAt: o.created_at,
  }));
}

export async function cancelOrder(orderId: string): Promise<void> {
  await fetch(`${getBaseUrl()}/v2/orders/${orderId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
}

// ── Portfolio History ─────────────────────────────────────────────

export interface PortfolioHistoryPoint {
  timestamp: number;
  equity: number;
  profitLoss: number;
  profitLossPct: number;
}

export async function getPortfolioHistory(
  period: "1D" | "1W" | "1M" | "3M" | "1A" = "1M",
  timeframe: "1Min" | "5Min" | "15Min" | "1H" | "1D" = "1D"
): Promise<PortfolioHistoryPoint[]> {
  const data = await alpacaFetch<any>(
    `/v2/account/portfolio/history?period=${period}&timeframe=${timeframe}`
  );

  const points: PortfolioHistoryPoint[] = [];
  if (data.timestamp) {
    for (let i = 0; i < data.timestamp.length; i++) {
      points.push({
        timestamp: data.timestamp[i] * 1000,
        equity: data.equity[i],
        profitLoss: data.profit_loss[i],
        profitLossPct: data.profit_loss_pct[i] * 100,
      });
    }
  }
  return points;
}

// ── Crypto Trading (Alpaca supports crypto) ───────────────────────

export async function getCryptoPosition(symbol: string): Promise<Position | null> {
  try {
    const p = await alpacaFetch<any>(`/v2/positions/${symbol}`);
    return {
      symbol: p.symbol,
      name: p.symbol,
      qty: parseFloat(p.qty),
      avgEntryPrice: parseFloat(p.avg_entry_price),
      currentPrice: parseFloat(p.current_price),
      marketValue: parseFloat(p.market_value),
      unrealizedPL: parseFloat(p.unrealized_pl),
      unrealizedPLPercent: parseFloat(p.unrealized_plpc) * 100,
      side: parseFloat(p.qty) > 0 ? "long" : "short",
    };
  } catch {
    return null;
  }
}
