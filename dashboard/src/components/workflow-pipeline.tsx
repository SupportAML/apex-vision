"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, Loader2, AlertCircle, Pause } from "lucide-react";
import type { Workflow } from "@/lib/data";

const statusConfig = {
  done: { icon: CheckCircle2, color: "text-emerald", bg: "bg-emerald/10 border-emerald/20", label: "Done" },
  running: { icon: Loader2, color: "text-cyan", bg: "bg-cyan/10 border-cyan/20", label: "Running" },
  waiting: { icon: Pause, color: "text-muted-foreground/50", bg: "bg-muted/50 border-border/30", label: "Waiting" },
  failed: { icon: AlertCircle, color: "text-rose", bg: "bg-rose/10 border-rose/20", label: "Failed" },
};

export function WorkflowPipeline({ workflow }: { workflow: Workflow }) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold">{workflow.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
              <Clock className="mr-1 h-2.5 w-2.5" />
              {workflow.schedule}
            </Badge>
            {workflow.lastRun ? (
              <span className="text-[11px] text-muted-foreground">Last: {workflow.lastRun}</span>
            ) : (
              <span className="text-[11px] text-muted-foreground/50">Never run</span>
            )}
          </div>
        </div>
        {workflow.objective && (
          <p className="text-xs text-muted-foreground">{workflow.objective}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-0 overflow-x-auto pb-1">
          {workflow.steps.map((step, i) => {
            const config = statusConfig[step.status];
            const Icon = config.icon;
            return (
              <div key={i} className="flex items-center">
                <div
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium ${config.bg} cursor-pointer hover:scale-105 transition-transform`}
                >
                  <Icon className={`h-3 w-3 ${config.color} ${step.status === "running" ? "animate-spin" : ""}`} />
                  <span className="whitespace-nowrap">{step.name}</span>
                </div>
                {i < workflow.steps.length - 1 && (
                  <div className="pipeline-connector mx-1 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkflowList({ workflows }: { workflows: Workflow[] }) {
  if (workflows.length === 0) {
    return (
      <div className="text-sm text-muted-foreground/50 py-12 text-center">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent mx-auto mb-4" />
        No workflows configured yet.
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-border to-transparent mx-auto mt-4" />
      </div>
    );
  }

  return (
    <div className="space-y-3 stagger-children">
      {workflows.map((wf) => (
        <WorkflowPipeline key={`${wf.entity}-${wf.slug}`} workflow={wf} />
      ))}
    </div>
  );
}
