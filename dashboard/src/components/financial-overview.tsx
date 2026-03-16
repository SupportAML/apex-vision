"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Receipt,
  CreditCard,
  Clock,
  Unplug,
} from "lucide-react";

export interface FinancialData {
  entity: string;
  provider: string;
  period: string;
  generated_at: string;
  revenue: {
    total_invoiced: number;
    total_collected: number;
    total_outstanding: number;
    overdue_count: number;
    overdue_total: number;
  };
  expenses: {
    total: number;
    by_category: Record<string, number>;
  };
  net: number;
  invoice_count: number;
  expense_count: number;
  ai_summary?: string;
  ai_alerts?: string[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function FinancialCard({
  label,
  value,
  icon: Icon,
  accent,
  detail,
}: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  accent: string;
  detail?: string;
}) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
          <Icon className={`h-3 w-3 ${accent}`} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {detail && (
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">{detail}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function FinancialOverview({ data }: { data: FinancialData }) {
  const topCategories = Object.entries(data.expenses.by_category).slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm tracking-[0.15em] uppercase text-muted-foreground/80 font-semibold flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5" /> Financials
        </h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] tracking-wide uppercase border-border/50">
            {data.provider}
          </Badge>
          <span className="text-[10px] text-muted-foreground/50">
            {data.period}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FinancialCard
          label="Revenue"
          value={formatCurrency(data.revenue.total_collected)}
          icon={TrendingUp}
          accent="text-emerald"
          detail={`${formatCurrency(data.revenue.total_invoiced)} invoiced`}
        />
        <FinancialCard
          label="Outstanding"
          value={formatCurrency(data.revenue.total_outstanding)}
          icon={Clock}
          accent="text-amber"
          detail={
            data.revenue.overdue_count > 0
              ? `${data.revenue.overdue_count} overdue (${formatCurrency(data.revenue.overdue_total)})`
              : "No overdue invoices"
          }
        />
        <FinancialCard
          label="Expenses"
          value={formatCurrency(data.expenses.total)}
          icon={CreditCard}
          accent="text-rose"
          detail={`${data.expense_count} transactions`}
        />
        <FinancialCard
          label="Net"
          value={formatCurrency(data.net)}
          icon={data.net >= 0 ? TrendingUp : TrendingDown}
          accent={data.net >= 0 ? "text-emerald" : "text-rose"}
          detail="collected - expenses"
        />
      </div>

      {/* AI Summary */}
      {data.ai_summary && (
        <Card className="border-border/50 bg-muted/20">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.ai_summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {data.ai_alerts && data.ai_alerts.length > 0 && (
        <div className="space-y-2">
          {data.ai_alerts.map((alert, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm text-amber bg-amber/5 border border-amber/20 rounded-lg px-3 py-2"
            >
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expense breakdown */}
      {topCategories.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Receipt className="h-3 w-3 text-violet" />
              Top Expense Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topCategories.map(([category, amount]) => {
                const pct = data.expenses.total > 0 ? (amount / data.expenses.total) * 100 : 0;
                return (
                  <div key={category} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-32 truncate">
                      {category}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet/60 to-rose/40"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-16 text-right">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function FinancialPlaceholder({ entitySlug }: { entitySlug: string }) {
  return (
    <Card className="border-dashed border-border/40">
      <CardContent className="py-8">
        <div className="flex flex-col items-center justify-center text-muted-foreground/40 text-sm gap-2">
          <Unplug className="h-6 w-6" />
          <p>No accounting data for {entitySlug}</p>
          <p className="text-xs">
            Add a <code className="bg-muted/50 px-1 rounded">financials.md</code> to this entity and connect Wave/Zoho
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
