"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp, TrendingDown, Wallet, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortfolioSummary } from "@/lib/markets/types";
import type { PortfolioHistoryPoint } from "@/lib/markets/alpaca";

interface PortfolioChartProps {
  portfolio: PortfolioSummary;
  history: PortfolioHistoryPoint[];
  period: string;
  onPeriodChange: (period: string) => void;
}

const periods = ["1D", "1W", "1M", "3M", "1A"];

export function PortfolioChart({ portfolio, history, period, onPeriodChange }: PortfolioChartProps) {
  const chartData = history.map((h) => ({
    time: new Date(h.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    equity: h.equity,
    pl: h.profitLoss,
  }));

  const isPositive = portfolio.dayPL >= 0;

  return (
    <div className="space-y-4">
      {/* Portfolio Summary Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 stagger-children">
        <StatCard
          icon={<Wallet className="h-3.5 w-3.5 text-emerald" />}
          label="Total Equity"
          value={`$${portfolio.equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          gradient="from-emerald/5"
        />
        <StatCard
          icon={isPositive ? <TrendingUp className="h-3.5 w-3.5 text-emerald" /> : <TrendingDown className="h-3.5 w-3.5 text-rose" />}
          label="Day P&L"
          value={`${isPositive ? "+" : ""}$${portfolio.dayPL.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          sub={`${isPositive ? "+" : ""}${portfolio.dayPLPercent.toFixed(2)}%`}
          isPositive={isPositive}
        />
        <StatCard
          icon={<DollarSign className="h-3.5 w-3.5 text-cyan" />}
          label="Cash"
          value={`$${portfolio.cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
        <StatCard
          icon={<ShoppingCart className="h-3.5 w-3.5 text-amber" />}
          label="Buying Power"
          value={`$${portfolio.buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
      </div>

      {/* Equity Chart */}
      <Card className="relative overflow-hidden">
        <div className={cn(
          "absolute top-0 left-0 right-0 h-0.5",
          isPositive ? "bg-gradient-to-r from-emerald to-cyan" : "bg-gradient-to-r from-rose to-amber"
        )} />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald" /> Portfolio Value
            </CardTitle>
            <div className="flex items-center gap-1">
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => onPeriodChange(p)}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded transition-colors",
                    period === p
                      ? "bg-emerald/10 text-emerald font-bold"
                      : "text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? "#34d399" : "#fb7185"} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={isPositive ? "#34d399" : "#fb7185"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    domain={["dataMin - 1000", "dataMax + 1000"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 15, 25, 0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Equity"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke={isPositive ? "#34d399" : "#fb7185"}
                    strokeWidth={2}
                    fill="url(#equityGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/40 text-sm">
                Connect Alpaca to see portfolio chart
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  isPositive,
  gradient,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  isPositive?: boolean;
  gradient?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      {gradient && <div className={`absolute inset-0 bg-gradient-to-br ${gradient} to-transparent`} />}
      <CardHeader className="pb-1 relative">
        <CardTitle className="text-[10px] tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
          {icon} {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <p className="text-xl font-bold tracking-tight tabular-nums">{value}</p>
        {sub && (
          <p className={cn("text-xs font-medium tabular-nums", isPositive ? "text-emerald" : "text-rose")}>
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
