"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/markets/notification-bell";
import { TradeDialog } from "@/components/markets/trade-dialog";
import type { TradeOrder, TradeOpportunity } from "@/lib/markets/types";

export default function TradePage() {
  const [orders, setOrders] = useState<TradeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [orderFilter, setOrderFilter] = useState<"all" | "open" | "closed">("all");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/markets/trade?status=${orderFilter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders(data.orders || []);
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [orderFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Quick trade - construct a simple opportunity for the dialog
  const quickTradeOpp: TradeOpportunity | undefined = searchSymbol
    ? {
        symbol: searchSymbol.toUpperCase(),
        name: searchSymbol.toUpperCase(),
        action: "buy",
        confidence: 0,
        entryPrice: 0,
        targetPrice: 0,
        stopLoss: 0,
        riskRewardRatio: 0,
        reasoning: "Manual trade — no AI recommendation",
        timeframe: "Immediate",
        potentialReturn: 0,
      }
    : undefined;

  function handleTradeConfirm() {
    setShowTradeDialog(false);
    setSearchSymbol("");
    fetchOrders();
  }

  const statusIcons: Record<string, any> = {
    submitted: <Clock className="h-3 w-3 text-amber" />,
    filled: <CheckCircle className="h-3 w-3 text-emerald" />,
    cancelled: <XCircle className="h-3 w-3 text-muted-foreground" />,
    rejected: <XCircle className="h-3 w-3 text-rose" />,
    pending_approval: <Clock className="h-3 w-3 text-violet" />,
  };

  const statusColors: Record<string, string> = {
    submitted: "text-amber bg-amber/10",
    filled: "text-emerald bg-emerald/10",
    cancelled: "text-muted-foreground bg-muted/50",
    rejected: "text-rose bg-rose/10",
    pending_approval: "text-violet bg-violet/10",
    new: "text-cyan bg-cyan/10",
    accepted: "text-amber bg-amber/10",
    partially_filled: "text-amber bg-amber/10",
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-cyan" /> Trade
          </h1>
          <p className="text-sm text-muted-foreground">
            Execute trades and manage orders via Alpaca
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading} className="text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            <span className="ml-1.5">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Quick Trade */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan to-emerald" />
        <CardHeader className="pb-2">
          <CardTitle className="text-xs tracking-wide uppercase text-muted-foreground">Quick Trade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
              <Input
                placeholder="Enter symbol (e.g. AAPL, TSLA, BTC/USD)"
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchSymbol) setShowTradeDialog(true);
                }}
              />
            </div>
            <Button
              onClick={() => setShowTradeDialog(true)}
              disabled={!searchSymbol}
              className="bg-emerald hover:bg-emerald/90"
            >
              Buy
            </Button>
            <Button
              onClick={() => {
                if (quickTradeOpp) {
                  quickTradeOpp.action = "sell";
                  setShowTradeDialog(true);
                }
              }}
              disabled={!searchSymbol}
              variant="outline"
              className="border-rose/30 text-rose hover:bg-rose/10"
            >
              Sell
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-2">
            For AI-recommended trades, visit the Predictions page
          </p>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-rose/30 bg-rose/5">
          <CardContent className="py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose" />
            <p className="text-xs text-rose">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Order History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm tracking-[0.15em] uppercase text-muted-foreground/80 font-semibold">
            Order History
          </h2>
          <div className="flex items-center gap-1">
            {(["all", "open", "closed"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setOrderFilter(f)}
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded transition-colors capitalize",
                  orderFilter === f
                    ? "bg-emerald/10 text-emerald font-bold"
                    : "text-muted-foreground/60 hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="pt-2">
            {loading && orders.length === 0 ? (
              <div className="py-10 text-center">
                <Loader2 className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2 animate-spin" />
                <p className="text-xs text-muted-foreground/40">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground/40">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No orders yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30">
                      {["Symbol", "Side", "Type", "Qty", "Price", "Status", "Time"].map((h) => (
                        <th key={h} className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider py-2 px-2 text-left">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 px-2 text-sm font-bold">{order.symbol}</td>
                        <td className="py-2.5 px-2">
                          <Badge className={cn(
                            "text-[9px] uppercase",
                            order.side === "buy" ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose"
                          )}>
                            {order.side}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-2 text-xs text-muted-foreground capitalize">{order.type}</td>
                        <td className="py-2.5 px-2 text-xs tabular-nums">{order.qty}</td>
                        <td className="py-2.5 px-2 text-xs tabular-nums">
                          {order.filledPrice
                            ? `$${order.filledPrice.toFixed(2)}`
                            : order.limitPrice
                              ? `$${order.limitPrice.toFixed(2)}`
                              : "Market"}
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1">
                            {statusIcons[order.status || ""] || <Clock className="h-3 w-3 text-muted-foreground" />}
                            <Badge className={cn("text-[9px]", statusColors[order.status || ""] || "bg-muted/50")}>
                              {order.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-[10px] text-muted-foreground/50">
                          {order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trade Dialog */}
      {showTradeDialog && quickTradeOpp && (
        <TradeDialog
          opportunity={quickTradeOpp}
          onClose={() => setShowTradeDialog(false)}
          onConfirm={handleTradeConfirm}
        />
      )}
    </div>
  );
}
