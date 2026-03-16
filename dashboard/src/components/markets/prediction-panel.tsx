"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Target, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PricePrediction, TradeOpportunity } from "@/lib/markets/types";

// ── Prediction Card ───────────────────────────────────────────────

export function PredictionCard({ prediction }: { prediction: PricePrediction }) {
  const mainPred = prediction.predictions.find((p) => p.timeframe === "1d") || prediction.predictions[0];
  if (!mainPred) return null;

  const isUp = mainPred.direction === "up";

  return (
    <Card className="relative overflow-hidden">
      <div className={cn(
        "absolute top-0 left-0 right-0 h-0.5",
        isUp ? "bg-gradient-to-r from-emerald to-cyan" : "bg-gradient-to-r from-rose to-amber"
      )} />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet" />
            <CardTitle className="text-sm font-bold">{prediction.symbol}</CardTitle>
          </div>
          <RiskBadge level={prediction.riskLevel} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Price Predictions by Timeframe */}
        <div className="grid grid-cols-5 gap-1">
          {prediction.predictions.map((p) => (
            <div key={p.timeframe} className="text-center">
              <p className="text-[9px] text-muted-foreground/60 uppercase">{p.timeframe}</p>
              <p className={cn(
                "text-xs font-bold tabular-nums",
                p.direction === "up" ? "text-emerald" : p.direction === "down" ? "text-rose" : "text-muted-foreground"
              )}>
                {p.direction === "up" ? "+" : ""}{p.percentChange.toFixed(1)}%
              </p>
              <div className="mt-0.5 mx-auto h-1 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    p.direction === "up" ? "bg-emerald" : p.direction === "down" ? "bg-rose" : "bg-muted-foreground"
                  )}
                  style={{ width: `${p.confidence}%` }}
                />
              </div>
              <p className="text-[8px] text-muted-foreground/40">{p.confidence}%</p>
            </div>
          ))}
        </div>

        {/* Sentiment Bars */}
        <div className="space-y-1.5">
          <SentimentBar label="Overall" value={prediction.sentiment.overall} />
          <SentimentBar label="News" value={prediction.sentiment.news} />
          <SentimentBar label="Technical" value={prediction.sentiment.technical} />
        </div>

        {/* Reasoning */}
        <p className="text-xs text-muted-foreground leading-relaxed">{prediction.reasoning}</p>

        {/* Key Factors */}
        <div className="flex flex-wrap gap-1">
          {prediction.keyFactors.slice(0, 3).map((f, i) => (
            <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
              {f}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Trade Opportunity Card ────────────────────────────────────────

export function OpportunityCard({ opportunity }: { opportunity: TradeOpportunity }) {
  const isBuy = opportunity.action === "buy";

  return (
    <Card className={cn(
      "relative overflow-hidden border-l-2",
      isBuy ? "border-l-emerald" : opportunity.action === "sell" ? "border-l-rose" : "border-l-amber"
    )}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">{opportunity.symbol}</h3>
              <Badge className={cn(
                "text-[10px] font-bold uppercase",
                isBuy ? "bg-emerald/10 text-emerald hover:bg-emerald/20" : "bg-rose/10 text-rose hover:bg-rose/20"
              )}>
                {opportunity.action}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{opportunity.name}</p>
          </div>
          <div className="text-right">
            <p className={cn("text-lg font-bold", isBuy ? "text-emerald" : "text-rose")}>
              +{opportunity.potentialReturn.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground/60">potential return</p>
          </div>
        </div>

        {/* Entry / Target / Stop Loss */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <PriceLevel icon={<Target className="h-3 w-3" />} label="Entry" value={opportunity.entryPrice} />
          <PriceLevel icon={<TrendingUp className="h-3 w-3 text-emerald" />} label="Target" value={opportunity.targetPrice} />
          <PriceLevel icon={<Shield className="h-3 w-3 text-rose" />} label="Stop Loss" value={opportunity.stopLoss} />
        </div>

        {/* Metrics Row */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber" />
            <span className="text-[10px] text-muted-foreground">Confidence: <strong>{opportunity.confidence}%</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">R/R: <strong>{opportunity.riskRewardRatio.toFixed(1)}:1</strong></span>
          </div>
          <span className="text-[10px] text-muted-foreground/60">{opportunity.timeframe}</span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">{opportunity.reasoning}</p>
      </CardContent>
    </Card>
  );
}

// ── Helper Components ─────────────────────────────────────────────

function SentimentBar({ label, value }: { label: string; value: number }) {
  const isPositive = value >= 0;
  const absValue = Math.abs(value);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] text-muted-foreground/60 w-14 text-right">{label}</span>
      <div className="flex-1 flex items-center gap-1">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden flex">
          {/* Negative side */}
          <div className="w-1/2 flex justify-end">
            {!isPositive && (
              <div
                className="h-full bg-rose rounded-full"
                style={{ width: `${absValue}%` }}
              />
            )}
          </div>
          {/* Positive side */}
          <div className="w-1/2">
            {isPositive && (
              <div
                className="h-full bg-emerald rounded-full"
                style={{ width: `${absValue}%` }}
              />
            )}
          </div>
        </div>
        <span className={cn(
          "text-[9px] font-medium tabular-nums w-8",
          isPositive ? "text-emerald" : "text-rose"
        )}>
          {isPositive ? "+" : ""}{value}
        </span>
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const config: Record<string, { color: string; icon: any }> = {
    low: { color: "text-emerald bg-emerald/10", icon: null },
    medium: { color: "text-amber bg-amber/10", icon: null },
    high: { color: "text-rose bg-rose/10", icon: <AlertTriangle className="h-2.5 w-2.5" /> },
    extreme: { color: "text-rose bg-rose/10", icon: <AlertTriangle className="h-2.5 w-2.5" /> },
  };

  const c = config[level] || config.medium;

  return (
    <span className={cn("text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded flex items-center gap-1", c.color)}>
      {c.icon}
      {level}
    </span>
  );
}

function PriceLevel({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-muted/30 rounded-lg px-2 py-1.5 text-center">
      <div className="flex items-center justify-center gap-1 mb-0.5">
        {icon}
        <span className="text-[9px] text-muted-foreground/60 uppercase">{label}</span>
      </div>
      <p className="text-xs font-bold tabular-nums">
        ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>
    </div>
  );
}
