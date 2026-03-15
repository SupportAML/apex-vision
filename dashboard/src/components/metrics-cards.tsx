"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Unplug } from "lucide-react";
import type { EntityGoal } from "@/lib/data";

export interface MetricItem {
  label: string;
  target: string;
  current: string | number;
  trend: "up" | "down" | "flat";
  source: string;
  connected: boolean;
}

const entityMetrics: Record<string, MetricItem[]> = {
  nlc: [
    { label: "Cases / Month", target: "8", current: 0, trend: "flat", source: "manual", connected: false },
    { label: "New Law Firm Relationships", target: "2", current: 0, trend: "flat", source: "manual", connected: false },
    { label: "Physicians on Roster", target: "5 new", current: 0, trend: "flat", source: "manual", connected: false },
    { label: "LinkedIn Posts / Week", target: "5", current: 0, trend: "flat", source: "LinkedIn API", connected: false },
    { label: "Website Visitors / Month", target: "1,000", current: 0, trend: "flat", source: "Google Analytics", connected: false },
  ],
  "a2z-equity": [
    { label: "Opportunities Vetted", target: "3+", current: 0, trend: "flat", source: "manual", connected: false },
    { label: "Capital Raised", target: "$500k", current: "$0", trend: "flat", source: "manual", connected: false },
    { label: "Active Investors", target: "15", current: 0, trend: "flat", source: "manual", connected: false },
  ],
  "club-haus": [
    { label: "Website Status", target: "Live", current: "Not started", trend: "flat", source: "Vercel", connected: false },
    { label: "Barbers Onboarded", target: "3", current: 0, trend: "flat", source: "manual", connected: false },
    { label: "Square POS", target: "Configured", current: "Not connected", trend: "flat", source: "Square API", connected: false },
    { label: "Bookings / Week", target: "50", current: 0, trend: "flat", source: "Square API", connected: false },
  ],
  apexmedlaw: [
    { label: "CC Branch Status", target: "Live", current: "Not started", trend: "flat", source: "manual", connected: false },
    { label: "Active Branches", target: "2", current: 0, trend: "flat", source: "manual", connected: false },
    { label: "Cases Placed (all branches)", target: "5/mo", current: 0, trend: "flat", source: "manual", connected: false },
  ],
  "titan-renovations": [
    { label: "Website Status", target: "Live", current: "Not started", trend: "flat", source: "Vercel", connected: false },
    { label: "Inbound Leads / Month", target: "5", current: 0, trend: "flat", source: "Google Analytics", connected: false },
    { label: "Invoices Sent", target: "10/mo", current: 0, trend: "flat", source: "WaveApps", connected: false },
  ],
  "porcupine-edu": [
    { label: "Articles Published", target: "20", current: 0, trend: "flat", source: "manual", connected: false },
    { label: "Organic Visitors / Month", target: "10k", current: 0, trend: "flat", source: "Google Analytics", connected: false },
    { label: "Keyword Rankings (page 1)", target: "5+", current: 0, trend: "flat", source: "Search Console", connected: false },
    { label: "T-Shirt Sales", target: "10/mo", current: 0, trend: "flat", source: "Printful", connected: false },
  ],
};

const trendIcons = {
  up: <TrendingUp className="h-4 w-4 text-emerald" />,
  down: <TrendingDown className="h-4 w-4 text-rose" />,
  flat: <Minus className="h-4 w-4 text-muted-foreground/30" />,
};

export function MetricsCards({ entitySlug }: { entitySlug: string }) {
  const metrics = entityMetrics[entitySlug] || [];

  if (metrics.length === 0) {
    return <p className="text-sm text-muted-foreground/50">No metrics configured.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
      {metrics.map((m) => (
        <Card key={m.label} className={`border-border/50 ${!m.connected ? "opacity-60" : ""}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-medium text-muted-foreground flex items-center justify-between">
              <span>{m.label}</span>
              {!m.connected && m.source !== "manual" && (
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded">
                  <Unplug className="h-2.5 w-2.5" />
                  {m.source}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold tracking-tight">{m.current}</p>
                <p className="text-[11px] text-muted-foreground/60">Target: {m.target}</p>
              </div>
              {trendIcons[m.trend]}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function GoalsView({ goals }: { goals: EntityGoal[] }) {
  return (
    <div className="space-y-4 stagger-children">
      {goals.map((g) => (
        <Card key={g.period} className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{g.period}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {g.items.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2.5 leading-relaxed">
                  <span className="mt-2 h-1 w-1 rounded-full bg-emerald/50 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
