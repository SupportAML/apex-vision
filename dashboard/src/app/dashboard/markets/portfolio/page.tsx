"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { PortfolioChart } from "@/components/markets/portfolio-chart";
import { PositionsTable } from "@/components/markets/positions-table";
import { NotificationBell } from "@/components/markets/notification-bell";
import type { PortfolioSummary } from "@/lib/markets/types";
import type { PortfolioHistoryPoint } from "@/lib/markets/alpaca";

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [history, setHistory] = useState<PortfolioHistoryPoint[]>([]);
  const [period, setPeriod] = useState("1M");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/markets/portfolio?period=${period}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setPortfolio(data.account);
      setHistory(data.history);
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Wallet className="h-6 w-6 text-emerald" /> Portfolio
          </h1>
          <p className="text-sm text-muted-foreground">
            Track your positions, P&L, and portfolio performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="outline" size="sm" onClick={fetchPortfolio} disabled={loading} className="text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            <span className="ml-1.5">Refresh</span>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-rose/30 bg-rose/5">
          <CardContent className="py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose" />
            <p className="text-xs text-rose">{error}</p>
            <p className="text-[10px] text-muted-foreground ml-2">
              Configure ALPACA_API_KEY and ALPACA_API_SECRET in your environment.
            </p>
          </CardContent>
        </Card>
      )}

      {loading && !portfolio ? (
        <Card className="animate-pulse">
          <CardContent className="py-20 text-center">
            <Loader2 className="h-8 w-8 text-emerald mx-auto mb-3 animate-spin" />
            <p className="text-sm text-muted-foreground">Loading portfolio data...</p>
          </CardContent>
        </Card>
      ) : portfolio ? (
        <>
          <PortfolioChart
            portfolio={portfolio}
            history={history}
            period={period}
            onPeriodChange={setPeriod}
          />
          <PositionsTable positions={portfolio.positions} />
        </>
      ) : !error ? (
        <Card className="border-dashed border-border/40">
          <CardContent className="py-16 text-center">
            <Wallet className="h-12 w-12 text-emerald/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Connect Alpaca to view your portfolio</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Add ALPACA_API_KEY and ALPACA_API_SECRET to your environment
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
