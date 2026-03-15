import { getEntitiesAsync, getWorkflowsAsync } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Target, Plug, Brain, Zap, Clock, Scale, Briefcase, PiggyBank, Scissors, Wrench } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const entityIcons: Record<string, typeof Briefcase> = {
  nlc: Scale,
  apexmedlaw: Briefcase,
  "a2z-equity": PiggyBank,
  "club-haus": Scissors,
  "titan-renovations": Wrench,
};

const entityAccents: Record<string, string> = {
  nlc: "from-emerald/20 to-cyan/10",
  apexmedlaw: "from-violet/20 to-rose/10",
  "a2z-equity": "from-amber/20 to-emerald/10",
  "club-haus": "from-cyan/20 to-violet/10",
  "titan-renovations": "from-rose/20 to-amber/10",
};

export default async function DashboardOverview() {
  const entities = await getEntitiesAsync();
  const allWorkflows = await getWorkflowsAsync();

  const brainConnected = !!process.env.ANTHROPIC_API_KEY;
  const connectorCount = 11;
  const connectedCount = [
    process.env.ANTHROPIC_API_KEY,
    process.env.GOOGLE_CLIENT_ID,
    process.env.LINKEDIN_ACCESS_TOKEN,
    process.env.GOOGLE_ANALYTICS_ID,
    process.env.SQUARE_ACCESS_TOKEN,
    process.env.TWITTER_API_KEY,
    process.env.INSTAGRAM_ACCESS_TOKEN,
    process.env.WAVEAPPS_API_TOKEN,
    process.env.PRINTFUL_API_KEY,
    process.env.VERCEL_TOKEN,
  ].filter(Boolean).length;

  const connectorPct = Math.round((connectedCount / connectorCount) * 100);

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald/5 to-transparent" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-[11px] tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-emerald" /> Brain Status
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-center gap-2.5">
              <div className={`h-2.5 w-2.5 rounded-full ${brainConnected ? "bg-emerald glow-green" : "bg-rose glow-rose"}`} />
              <p className="text-lg font-bold">{brainConnected ? "Online" : "Offline"}</p>
            </div>
            {!brainConnected && (
              <p className="text-xs text-muted-foreground mt-1">Add ANTHROPIC_API_KEY</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber" /> Entities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{entities.length}</p>
            <p className="text-xs text-muted-foreground">businesses tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[11px] tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-violet" /> Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{allWorkflows.length}</p>
            <p className="text-xs text-muted-foreground">automation pipelines</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber/5 to-transparent" />
          <CardHeader className="pb-2 relative">
            <CardTitle className="text-[11px] tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
              <Plug className="h-3.5 w-3.5 text-cyan" /> Connectors
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold">{connectedCount}</p>
              <p className="text-lg text-muted-foreground mb-0.5">/ {connectorCount}</p>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald to-cyan transition-all duration-700" style={{ width: `${connectorPct}%` }} />
            </div>
            <Link href="/dashboard/approvals" className="text-xs text-emerald hover:underline mt-1.5 inline-block">
              Set up connectors
            </Link>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-xs tracking-[0.15em] uppercase text-muted-foreground/60 mb-4 font-medium">Entities</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
          {entities.map((entity) => {
            const wfCount = allWorkflows.filter((w) => w.entity === entity.slug).length;
            const Icon = entityIcons[entity.slug] || Briefcase;
            const gradient = entityAccents[entity.slug] || "from-muted/20 to-transparent";
            return (
              <Link key={entity.slug} href={`/dashboard/entity/${entity.slug}`}>
                <Card className="card-hover relative overflow-hidden group cursor-pointer">
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/80">
                          <Icon className="h-4 w-4 text-foreground/70" />
                        </div>
                        <CardTitle className="text-sm font-bold">{entity.name}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-[10px] tracking-wide uppercase border-border/50">{entity.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{entity.description}</p>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground/70">
                      <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> {wfCount} workflows</span>
                      <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {entity.type}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <Card className="border-dashed border-border/40">
        <CardHeader>
          <CardTitle className="text-xs tracking-[0.15em] uppercase text-muted-foreground/60 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> Intervention Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-10 text-muted-foreground/40 text-sm">
            <div className="text-center">
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-border to-transparent mx-auto mb-4" />
              <p>Tracking who changed what, and what happened after.</p>
              <p className="text-xs mt-1">Coming in v2</p>
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-border to-transparent mx-auto mt-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
