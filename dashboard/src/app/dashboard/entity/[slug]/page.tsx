import { getEntitiesAsync, getWorkflowsAsync, getEntityGoalsAsync } from "@/lib/data";
import { getEntityFinancials } from "@/lib/financials";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkflowList } from "@/components/workflow-pipeline";
import { MetricsCards, GoalsView } from "@/components/metrics-cards";
import { FinancialOverview, FinancialPlaceholder } from "@/components/financial-overview";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { Scale, Briefcase, PiggyBank, Scissors, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

const entityIcons: Record<string, typeof Briefcase> = {
  nlc: Scale,
  apexmedlaw: Briefcase,
  "a2z-equity": PiggyBank,
  "club-haus": Scissors,
  "titan-renovations": Wrench,
};

export default async function EntityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entities = await getEntitiesAsync();
  const entity = entities.find((e) => e.slug === slug);

  if (!entity) return notFound();

  const workflows = await getWorkflowsAsync(slug);
  const goals = await getEntityGoalsAsync(slug);
  const financials = await getEntityFinancials(slug);
  const Icon = entityIcons[slug] || Briefcase;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/80 border border-border/50">
          <Icon className="h-6 w-6 text-foreground/60" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight">{entity.name}</h2>
            <Badge variant="outline" className="text-[10px] tracking-wide uppercase border-border/50">{entity.type}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{entity.description}</p>
        </div>
      </div>

      <Tabs defaultValue="metrics">
        <TabsList className="bg-muted/30 border border-border/30">
          <TabsTrigger value="metrics" className="text-xs">Metrics</TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs">
            Workflows
            <Badge variant="outline" className="ml-1.5 h-4 px-1 text-[9px] border-border/50">{workflows.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="financials" className="text-xs">Financials</TabsTrigger>
          <TabsTrigger value="goals" className="text-xs">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="mt-5">
          <MetricsCards entitySlug={slug} />
        </TabsContent>

        <TabsContent value="workflows" className="mt-5">
          <WorkflowList workflows={workflows} />
        </TabsContent>

        <TabsContent value="financials" className="mt-5">
          {financials ? (
            <FinancialOverview data={financials} />
          ) : (
            <FinancialPlaceholder entitySlug={slug} />
          )}
        </TabsContent>

        <TabsContent value="goals" className="mt-5">
          <GoalsView goals={goals} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
