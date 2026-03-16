"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Position } from "@/lib/markets/types";

export function PositionsTable({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return (
      <Card className="border-dashed border-border/40">
        <CardContent className="py-10">
          <div className="text-center text-muted-foreground/40 text-sm">
            <p>No open positions</p>
            <p className="text-xs mt-1">Execute a trade to see your positions here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
  const totalPL = positions.reduce((s, p) => s + p.unrealizedPL, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs tracking-wide uppercase text-muted-foreground">
            Open Positions ({positions.length})
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Value: <strong className="text-foreground">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </span>
            <span className={cn("text-xs font-medium", totalPL >= 0 ? "text-emerald" : "text-rose")}>
              {totalPL >= 0 ? "+" : ""}${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                {["Symbol", "Qty", "Avg Entry", "Current", "Market Value", "P&L", "P&L %"].map((h) => (
                  <th key={h} className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider py-2 px-2 text-right first:text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                const isPositive = pos.unrealizedPL >= 0;
                return (
                  <tr key={pos.symbol} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-1.5 w-1.5 rounded-full", isPositive ? "bg-emerald" : "bg-rose")} />
                        <span className="text-sm font-bold">{pos.symbol}</span>
                        <span className="text-[9px] text-muted-foreground/40 uppercase">{pos.side}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right text-sm tabular-nums">{pos.qty}</td>
                    <td className="py-2.5 px-2 text-right text-sm tabular-nums text-muted-foreground">
                      ${pos.avgEntryPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-sm tabular-nums font-medium">
                      ${pos.currentPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-sm tabular-nums">
                      ${pos.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={cn("py-2.5 px-2 text-right text-sm tabular-nums font-medium", isPositive ? "text-emerald" : "text-rose")}>
                      <div className="flex items-center justify-end gap-1">
                        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {isPositive ? "+" : ""}${pos.unrealizedPL.toFixed(2)}
                      </div>
                    </td>
                    <td className={cn("py-2.5 px-2 text-right text-sm tabular-nums font-medium", isPositive ? "text-emerald" : "text-rose")}>
                      {isPositive ? "+" : ""}{pos.unrealizedPLPercent.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
