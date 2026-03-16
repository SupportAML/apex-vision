"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, RefreshCw, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PredictionCard, OpportunityCard } from "@/components/markets/prediction-panel";
import { NotificationBell } from "@/components/markets/notification-bell";
import { TradeDialog } from "@/components/markets/trade-dialog";
import type { MarketPrediction, TradeOpportunity, TradeOrder } from "@/lib/markets/types";

export default function PredictionsPage() {
  const [predictions, setPredictions] = useState<MarketPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedOpp, setSelectedOpp] = useState<TradeOpportunity | null>(null);

  async function runPredictions() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/markets/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPredictions(data);

      // Send notification about new predictions
      await fetch("/api/markets/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          type: "prediction",
          title: "New AI Predictions Generated",
          message: `${data.predictions?.length || 0} assets analyzed. ${data.topOpportunities?.length || 0} opportunities found.`,
          urgency: "medium",
        }),
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleTradeConfirm(order: TradeOrder) {
    setSelectedOpp(null);
  }

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-violet" /> AI Predictions
          </h1>
          <p className="text-sm text-muted-foreground">
            Claude analyzes technicals, sentiment & news to predict market movements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button onClick={runPredictions} disabled={loading} className="bg-violet hover:bg-violet/90">
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="ml-1.5">Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span className="ml-1.5">Generate Predictions</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="border-violet/20">
          <CardContent className="py-12 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="relative">
                <Brain className="h-8 w-8 text-violet animate-pulse" />
                <div className="absolute -inset-2 rounded-full border-2 border-violet/20 animate-spin" style={{ borderTopColor: "transparent" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">AI is analyzing the markets...</p>
                <p className="text-xs text-muted-foreground">
                  Processing technical indicators, news sentiment & price patterns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-rose/30 bg-rose/5">
          <CardContent className="py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose" />
            <p className="text-xs text-rose">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* No predictions yet */}
      {!loading && !predictions && !error && (
        <Card className="border-dashed border-border/40">
          <CardContent className="py-16 text-center">
            <Brain className="h-12 w-12 text-violet/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">No predictions generated yet</p>
            <p className="text-xs text-muted-foreground/60 mb-4">
              Click &quot;Generate Predictions&quot; to run the full AI analysis pipeline
            </p>
            <Button onClick={runPredictions} variant="outline" className="text-xs">
              <Sparkles className="h-3 w-3 mr-1.5" /> Run First Analysis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {predictions && (
        <>
          {/* Market Overview */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet via-cyan to-emerald" />
            <CardContent className="pt-5">
              <p className="text-xs tracking-wide uppercase text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                <Brain className="h-3 w-3 text-violet" /> Market Overview
              </p>
              <p className="text-sm text-foreground leading-relaxed">{predictions.marketOverview}</p>
              {predictions.warnings.length > 0 && (
                <div className="mt-3 space-y-1">
                  {predictions.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <AlertTriangle className="h-3 w-3 text-amber shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber/80">{w}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[9px] text-muted-foreground/30 mt-3">
                Generated at {new Date(predictions.generatedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Top Opportunities */}
          {predictions.topOpportunities.length > 0 && (
            <div>
              <h2 className="text-sm tracking-[0.15em] uppercase text-muted-foreground/80 font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber" /> Top Trade Opportunities
              </h2>
              <div className="grid gap-3 lg:grid-cols-3 stagger-children">
                {predictions.topOpportunities.map((opp, i) => (
                  <div key={i} onClick={() => setSelectedOpp(opp)} className="cursor-pointer">
                    <OpportunityCard opportunity={opp} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Predictions */}
          <div>
            <h2 className="text-sm tracking-[0.15em] uppercase text-muted-foreground/80 font-semibold mb-3">
              Asset Predictions
            </h2>
            <div className="grid gap-3 lg:grid-cols-2 stagger-children">
              {predictions.predictions.map((pred) => (
                <PredictionCard key={pred.symbol} prediction={pred} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Trade Dialog */}
      {selectedOpp && (
        <TradeDialog
          opportunity={selectedOpp}
          onClose={() => setSelectedOpp(null)}
          onConfirm={handleTradeConfirm}
        />
      )}
    </div>
  );
}
