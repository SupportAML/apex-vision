"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TradeOrder, TradeOpportunity } from "@/lib/markets/types";

interface TradeDialogProps {
  opportunity?: TradeOpportunity;
  onClose: () => void;
  onConfirm: (order: TradeOrder) => void;
}

export function TradeDialog({ opportunity, onClose, onConfirm }: TradeDialogProps) {
  const [qty, setQty] = useState("1");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState(opportunity?.entryPrice?.toFixed(2) || "");
  const [step, setStep] = useState<"review" | "confirm" | "submitting" | "done" | "error">("review");
  const [error, setError] = useState("");

  const side = opportunity?.action === "sell" ? "sell" : "buy";
  const symbol = opportunity?.symbol || "";
  const estimatedCost = parseFloat(qty) * (orderType === "limit" ? parseFloat(limitPrice) : (opportunity?.entryPrice || 0));

  async function handleSubmit() {
    setStep("confirm");
  }

  async function handleConfirm() {
    setStep("submitting");

    const order: TradeOrder = {
      symbol,
      side,
      type: orderType,
      qty: parseFloat(qty),
      limitPrice: orderType === "limit" ? parseFloat(limitPrice) : undefined,
      timeInForce: "day",
    };

    try {
      const res = await fetch("/api/markets/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", order }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onConfirm(data.order);
      setStep("done");

      // Also send notification
      await fetch("/api/markets/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          type: "trade",
          title: `${side.toUpperCase()} Order Submitted`,
          message: `${side === "buy" ? "Bought" : "Sold"} ${qty} shares of ${symbol} — ${orderType} order`,
          symbol,
          tradeAction: side,
          urgency: "high",
        }),
      });
    } catch (e: any) {
      setError(e.message);
      setStep("error");
    }
  }

  if (!opportunity) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={cn(
          "h-1 rounded-t-xl",
          side === "buy" ? "bg-gradient-to-r from-emerald to-cyan" : "bg-gradient-to-r from-rose to-amber"
        )} />

        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              <CardTitle className="text-base">
                {step === "done" ? "Order Submitted" : step === "error" ? "Order Failed" : `${side.toUpperCase()} ${symbol}`}
              </CardTitle>
            </div>
            <Badge className={cn(
              "text-[10px] uppercase",
              side === "buy" ? "bg-emerald/10 text-emerald" : "bg-rose/10 text-rose"
            )}>
              {side}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "review" && (
            <>
              {/* AI Reasoning */}
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">AI Recommendation</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{opportunity.reasoning}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-muted-foreground">
                    Confidence: <strong className="text-emerald">{opportunity.confidence}%</strong>
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    R/R: <strong>{opportunity.riskRewardRatio.toFixed(1)}:1</strong>
                  </span>
                </div>
              </div>

              {/* Order Form */}
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Quantity</label>
                  <Input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    min="1"
                    className="mt-1 tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Order Type</label>
                  <div className="flex gap-2 mt-1">
                    {(["market", "limit"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setOrderType(t)}
                        className={cn(
                          "flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          orderType === t ? "bg-emerald/10 text-emerald" : "bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {orderType === "limit" && (
                  <div>
                    <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Limit Price</label>
                    <Input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      step="0.01"
                      className="mt-1 tabular-nums"
                    />
                  </div>
                )}

                <div className="bg-muted/30 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Estimated Cost</span>
                  <span className="text-sm font-bold tabular-nums">
                    ${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Paper Trading Warning */}
              <div className="flex items-start gap-2 bg-amber/5 border border-amber/20 rounded-lg p-2.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber/80 leading-relaxed">
                  Paper trading mode. No real money will be used.
                </p>
              </div>
            </>
          )}

          {step === "confirm" && (
            <div className="text-center py-4">
              <AlertTriangle className="h-10 w-10 text-amber mx-auto mb-3" />
              <p className="text-sm font-bold mb-1">Confirm Trade</p>
              <p className="text-xs text-muted-foreground">
                {side.toUpperCase()} {qty} shares of {symbol} at {orderType === "limit" ? `$${limitPrice}` : "market price"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Estimated total: <strong>${estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </p>
            </div>
          )}

          {step === "submitting" && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 text-emerald mx-auto mb-3 animate-spin" />
              <p className="text-sm text-muted-foreground">Submitting order to Alpaca...</p>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-8">
              <CheckCircle className="h-10 w-10 text-emerald mx-auto mb-3" />
              <p className="text-sm font-bold text-emerald mb-1">Order Submitted Successfully</p>
              <p className="text-xs text-muted-foreground">
                {side.toUpperCase()} {qty} {symbol} — check your portfolio for updates
              </p>
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-8">
              <XCircle className="h-10 w-10 text-rose mx-auto mb-3" />
              <p className="text-sm font-bold text-rose mb-1">Order Failed</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          {step === "review" && (
            <>
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className={cn(
                  "flex-1",
                  side === "buy" ? "bg-emerald hover:bg-emerald/90" : "bg-rose hover:bg-rose/90"
                )}
                onClick={handleSubmit}
              >
                Review {side === "buy" ? "Buy" : "Sell"} Order
              </Button>
            </>
          )}
          {step === "confirm" && (
            <>
              <Button variant="outline" className="flex-1" onClick={() => setStep("review")}>Back</Button>
              <Button
                className={cn(
                  "flex-1",
                  side === "buy" ? "bg-emerald hover:bg-emerald/90" : "bg-rose hover:bg-rose/90"
                )}
                onClick={handleConfirm}
              >
                Confirm {side === "buy" ? "Buy" : "Sell"}
              </Button>
            </>
          )}
          {(step === "done" || step === "error") && (
            <Button className="flex-1" onClick={onClose}>Close</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
