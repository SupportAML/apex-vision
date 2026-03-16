"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TechnicalAnalysis, TechnicalSignal } from "@/lib/markets/types";

export function TechnicalGauge({ analysis }: { analysis: TechnicalAnalysis }) {
  const score = analysis.overallScore;
  const rotation = (score / 100) * 90; // -90 to +90 degrees

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-violet" /> {analysis.symbol} Technicals
          </CardTitle>
          <SignalBadge signal={analysis.overallSignal} />
        </div>
      </CardHeader>
      <CardContent>
        {/* Gauge */}
        <div className="flex justify-center mb-4">
          <div className="relative w-32 h-16 overflow-hidden">
            {/* Gauge background */}
            <div className="absolute bottom-0 left-0 right-0 h-32 w-32 rounded-full border-8 border-muted/30 clip-top" />
            {/* Gauge fill */}
            <div
              className="absolute bottom-0 left-1/2 w-1 h-14 bg-foreground rounded-full origin-bottom transition-transform duration-700"
              style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
            />
            {/* Center dot */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 h-3 w-3 rounded-full bg-foreground border-2 border-card" />
            {/* Labels */}
            <span className="absolute bottom-0 left-0 text-[8px] text-rose font-bold">SELL</span>
            <span className="absolute bottom-0 right-0 text-[8px] text-emerald font-bold">BUY</span>
          </div>
        </div>

        <p className="text-center text-2xl font-bold tabular-nums mb-3">{score}</p>

        {/* Individual Signals */}
        <div className="space-y-1.5">
          {analysis.signals.map((s) => (
            <SignalRow key={s.indicator} signal={s} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SignalRow({ signal }: { signal: TechnicalSignal }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground/70 w-28 truncate">{signal.indicator}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted/30 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            signal.signal === "buy" ? "bg-emerald" : signal.signal === "sell" ? "bg-rose" : "bg-muted-foreground/30"
          )}
          style={{ width: `${signal.strength}%` }}
        />
      </div>
      <span className={cn(
        "text-[9px] font-bold uppercase w-12 text-right",
        signal.signal === "buy" ? "text-emerald" : signal.signal === "sell" ? "text-rose" : "text-muted-foreground/50"
      )}>
        {signal.signal}
      </span>
    </div>
  );
}

function SignalBadge({ signal }: { signal: TechnicalAnalysis["overallSignal"] }) {
  const config = {
    strong_buy: { label: "STRONG BUY", color: "text-emerald bg-emerald/10 glow-green" },
    buy: { label: "BUY", color: "text-emerald bg-emerald/10" },
    neutral: { label: "NEUTRAL", color: "text-muted-foreground bg-muted/50" },
    sell: { label: "SELL", color: "text-rose bg-rose/10" },
    strong_sell: { label: "STRONG SELL", color: "text-rose bg-rose/10 glow-rose" },
  };

  const c = config[signal];
  return (
    <span className={cn("text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded", c.color)}>
      {c.label}
    </span>
  );
}
