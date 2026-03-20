"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, Wrench, Eye, Loader2 } from "lucide-react";
import { useState } from "react";

export interface IntelligenceItem {
  id: string;
  date: string;
  title: string;
  summary: string;
  relevantEntities: string[];
  recommendation: string;
  actionable: boolean;
  category: "tool" | "technique" | "algorithm" | "trend" | "competitor";
}

const categoryConfig: Record<string, { icon: typeof Lightbulb; color: string; label: string }> = {
  tool: { icon: Wrench, color: "bg-cyan/10 text-cyan", label: "New Tool" },
  technique: { icon: Lightbulb, color: "bg-amber/10 text-amber", label: "Technique" },
  algorithm: { icon: TrendingUp, color: "bg-violet/10 text-violet", label: "Algorithm" },
  trend: { icon: TrendingUp, color: "bg-emerald/10 text-emerald", label: "Trend" },
  competitor: { icon: Eye, color: "bg-rose/10 text-rose", label: "Competitor" },
};

function IntelligenceCard({
  item,
  onIncorporate,
}: {
  item: IntelligenceItem;
  onIncorporate: (item: IntelligenceItem) => void;
}) {
  const [loading, setLoading] = useState(false);
  const config = categoryConfig[item.category] || categoryConfig.trend;
  const Icon = config.icon;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={`${config.color} border-0 text-[10px]`}>
              <Icon className="h-2.5 w-2.5 mr-0.5" />
              {config.label}
            </Badge>
            {item.actionable && (
              <Badge className="bg-emerald/10 text-emerald border-0 text-[10px]">
                Actionable
              </Badge>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground">{item.date}</span>
        </div>
        <CardTitle className="text-sm font-bold">{item.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{item.summary}</p>

        <div className="rounded-lg bg-muted/20 border border-border/20 p-3">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1">Recommendation</p>
          <p className="text-xs leading-relaxed">{item.recommendation}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {item.relevantEntities.map((entity) => (
              <Badge key={entity} variant="outline" className="text-[10px] border-border/50">
                {entity}
              </Badge>
            ))}
          </div>
          {item.actionable && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-emerald/30 text-emerald hover:bg-emerald/10 text-[11px]"
              onClick={async () => {
                setLoading(true);
                await onIncorporate(item);
                setLoading(false);
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
              Incorporate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface IntelligenceFeedProps {
  items: IntelligenceItem[];
  onIncorporate: (item: IntelligenceItem) => void;
}

export function IntelligenceFeed({ items, onIncorporate }: IntelligenceFeedProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">No intelligence reports yet</p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">
          The intelligence scanner runs daily and will populate findings here
        </p>
      </div>
    );
  }

  // Group by date
  const byDate = items.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, IntelligenceItem[]>);

  return (
    <div className="space-y-6">
      {Object.entries(byDate)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, dateItems]) => (
          <div key={date} className="space-y-3">
            <h4 className="text-xs tracking-[0.1em] uppercase text-muted-foreground/60 font-medium">
              {date}
            </h4>
            {dateItems.map((item) => (
              <IntelligenceCard
                key={item.id}
                item={item}
                onIncorporate={onIncorporate}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
