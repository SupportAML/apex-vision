"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileText, Mail, TrendingUp, CheckCircle2, Clock, XCircle } from "lucide-react";

interface MarketingStats {
  pendingSocial: number;
  pendingEmails: number;
  publishedToday: number;
  approvalRate: number;
  totalRejected: number;
  intelligenceFindings: number;
}

export function MarketingStatsCards({ stats }: { stats: MarketingStats }) {
  const cards = [
    {
      label: "Pending Social",
      value: stats.pendingSocial,
      icon: Clock,
      color: "text-amber",
      bgColor: "bg-amber/10",
    },
    {
      label: "Pending Emails",
      value: stats.pendingEmails,
      icon: Mail,
      color: "text-violet",
      bgColor: "bg-violet/10",
    },
    {
      label: "Published Today",
      value: stats.publishedToday,
      icon: CheckCircle2,
      color: "text-emerald",
      bgColor: "bg-emerald/10",
    },
    {
      label: "Approval Rate",
      value: `${stats.approvalRate}%`,
      icon: TrendingUp,
      color: stats.approvalRate >= 70 ? "text-emerald" : "text-amber",
      bgColor: stats.approvalRate >= 70 ? "bg-emerald/10" : "bg-amber/10",
    },
    {
      label: "Rejected",
      value: stats.totalRejected,
      icon: XCircle,
      color: "text-rose",
      bgColor: "bg-rose/10",
    },
    {
      label: "Intel Findings",
      value: stats.intelligenceFindings,
      icon: FileText,
      color: "text-cyan",
      bgColor: "bg-cyan/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="border-border/50">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-3.5 w-3.5 ${card.color}`} />
              </div>
            </div>
            <p className="text-xl font-bold tracking-tight">{card.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
