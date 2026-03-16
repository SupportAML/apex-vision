"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceCardProps {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  signal?: "strong_buy" | "buy" | "neutral" | "sell" | "strong_sell";
  onClick?: () => void;
}

const signalConfig = {
  strong_buy: { label: "STRONG BUY", color: "text-emerald", bg: "bg-emerald/10", glow: "glow-green" },
  buy: { label: "BUY", color: "text-emerald", bg: "bg-emerald/10", glow: "" },
  neutral: { label: "HOLD", color: "text-muted-foreground", bg: "bg-muted/50", glow: "" },
  sell: { label: "SELL", color: "text-rose", bg: "bg-rose/10", glow: "" },
  strong_sell: { label: "STRONG SELL", color: "text-rose", bg: "bg-rose/10", glow: "glow-rose" },
};

export function PriceCard({ symbol, name, price, change, changePercent, volume, signal, onClick }: PriceCardProps) {
  const isPositive = change >= 0;
  const sig = signal ? signalConfig[signal] : null;

  return (
    <Card
      className={cn("card-hover cursor-pointer relative overflow-hidden group", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        isPositive ? "bg-gradient-to-br from-emerald/5 to-transparent" : "bg-gradient-to-br from-rose/5 to-transparent"
      )} />

      <CardHeader className="pb-1 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              isPositive ? "bg-emerald glow-green" : change < 0 ? "bg-rose glow-rose" : "bg-muted-foreground"
            )} />
            <CardTitle className="text-sm font-bold tracking-tight">{symbol}</CardTitle>
          </div>
          {sig && (
            <span className={cn("text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded", sig.color, sig.bg, sig.glow)}>
              {sig.label}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground/60 truncate">{name}</p>
      </CardHeader>

      <CardContent className="relative">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className={cn("flex items-center gap-1 mt-0.5", isPositive ? "text-emerald" : "text-rose")}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3 text-muted-foreground" />}
              <span className="text-xs font-medium tabular-nums">
                {isPositive ? "+" : ""}{change.toFixed(2)} ({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          {volume !== undefined && (
            <p className="text-[10px] text-muted-foreground/40 tabular-nums">
              Vol: {formatVolume(volume)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatVolume(v: number): string {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(1) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toString();
}
