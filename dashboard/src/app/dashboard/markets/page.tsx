"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Brain,
  RefreshCw,
  Activity,
  Loader2,
  BarChart3,
  Wallet,
  ShoppingCart,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PriceCard } from "@/components/markets/price-card";
import { NotificationBell } from "@/components/markets/notification-bell";
import type { MarketQuote, CryptoQuote, TechnicalAnalysis } from "@/lib/markets/types";

interface MarketData {
  stocks: MarketQuote[];
  crypto: CryptoQuote[];
  technicals: Record<string, TechnicalAnalysis>;
  stockError?: string;
}

export default function MarketsPage() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/markets/data");
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setData(json);
      setLastRefresh(new Date());
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const topGainers = data?.stocks
    .filter((s) => s.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 3) || [];

  const topLosers = data?.stocks
    .filter((s) => s.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 3) || [];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Markets</h1>
          <p className="text-sm text-muted-foreground">
            Real-time market data, AI predictions & trading
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="text-xs"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            <span className="ml-1.5">Refresh</span>
          </Button>
          {lastRefresh && (
            <span className="text-[10px] text-muted-foreground/40">
              {lastRefresh.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 stagger-children">
        <QuickNavCard
          href="/dashboard/markets/predictions"
          icon={<Brain className="h-5 w-5 text-violet" />}
          title="AI Predictions"
          description="Claude-powered market analysis"
          gradient="from-violet/10 to-transparent"
        />
        <QuickNavCard
          href="/dashboard/markets/portfolio"
          icon={<Wallet className="h-5 w-5 text-emerald" />}
          title="Portfolio"
          description="Positions & P&L tracking"
          gradient="from-emerald/10 to-transparent"
        />
        <QuickNavCard
          href="/dashboard/markets/trade"
          icon={<ShoppingCart className="h-5 w-5 text-cyan" />}
          title="Trade"
          description="Execute trades via Alpaca"
          gradient="from-cyan/10 to-transparent"
        />
        <Card className="relative overflow-hidden group card-hover">
          <div className="absolute inset-0 bg-gradient-to-br from-amber/10 to-transparent" />
          <CardContent className="pt-4 relative">
            <Activity className="h-5 w-5 text-amber mb-2" />
            <p className="text-sm font-bold">Market Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={cn("h-2 w-2 rounded-full", isMarketOpen() ? "bg-emerald glow-green" : "bg-rose")} />
              <span className="text-xs text-muted-foreground">
                {isMarketOpen() ? "Market Open" : "Market Closed"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-rose/30 bg-rose/5">
          <CardContent className="py-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose" />
            <p className="text-xs text-rose">{error}</p>
            <p className="text-[10px] text-muted-foreground ml-2">
              Make sure POLYGON_API_KEY is configured in your environment.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stocks Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm tracking-[0.15em] uppercase text-muted-foreground/80 font-semibold flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5" /> US Stocks
          </h2>
          {topGainers.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-emerald" />
                <span className="text-[10px] text-emerald font-medium">
                  {topGainers[0]?.symbol} +{topGainers[0]?.changePercent.toFixed(1)}%
                </span>
              </div>
              {topLosers.length > 0 && (
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-rose" />
                  <span className="text-[10px] text-rose font-medium">
                    {topLosers[0]?.symbol} {topLosers[0]?.changePercent.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 stagger-children">
          {loading && !data ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            data?.stocks.map((stock) => (
              <PriceCard
                key={stock.symbol}
                symbol={stock.symbol}
                name={stock.name}
                price={stock.price}
                change={stock.change}
                changePercent={stock.changePercent}
                volume={stock.volume}
                signal={data.technicals[stock.symbol]?.overallSignal}
              />
            ))
          )}
        </div>
      </div>

      {/* Crypto Grid */}
      <div>
        <h2 className="text-sm tracking-[0.15em] uppercase text-muted-foreground/80 font-semibold flex items-center gap-2 mb-3">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-6v2h2v-2h1c1.1 0 2-.9 2-2v-1c0-1.1-.9-2-2-2h-3V9h4V7h-2V5h-2v2h-1c-1.1 0-2 .9-2 2v1c0 1.1.9 2 2 2h3v2h-4v2h2z"/></svg>
          Crypto
        </h2>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5 stagger-children">
          {loading && !data ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            data?.crypto.map((coin) => (
              <PriceCard
                key={coin.symbol}
                symbol={coin.symbol}
                name={coin.name}
                price={coin.price}
                change={coin.change}
                changePercent={coin.changePercent}
                volume={coin.volume}
                signal={data?.technicals[coin.symbol]?.overallSignal}
              />
            ))
          )}
        </div>
      </div>

      {/* Paper Trading Notice */}
      <Card className="border-dashed border-amber/30">
        <CardContent className="py-3 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 text-amber shrink-0" />
          <div>
            <p className="text-xs text-amber font-medium">Paper Trading Mode Active</p>
            <p className="text-[10px] text-muted-foreground">
              All trades execute on Alpaca&apos;s paper trading environment. No real money at risk.
              Set ALPACA_LIVE=true in environment to switch to live trading.
            </p>
          </div>
          <Badge className="text-[9px] bg-amber/10 text-amber shrink-0">PAPER</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickNavCard({
  href,
  icon,
  title,
  description,
  gradient,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <Link href={href}>
      <Card className="relative overflow-hidden group card-hover cursor-pointer">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        <CardContent className="pt-4 relative">
          {icon}
          <p className="text-sm font-bold mt-2">{title}</p>
          <p className="text-[11px] text-muted-foreground/60">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="pt-4 space-y-3">
        <div className="h-3 bg-muted rounded w-16" />
        <div className="h-6 bg-muted rounded w-24" />
        <div className="h-3 bg-muted rounded w-20" />
      </CardContent>
    </Card>
  );
}

function isMarketOpen(): boolean {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = et.getDay();
  const hour = et.getHours();
  const minute = et.getMinutes();
  const timeNum = hour * 60 + minute;
  return day >= 1 && day <= 5 && timeNum >= 570 && timeNum <= 960;
}
