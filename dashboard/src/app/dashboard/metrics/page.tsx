import { getEntitiesAsync } from "@/lib/data";
import { MetricsCards } from "@/components/metrics-cards";

export const dynamic = "force-dynamic";

export default async function MetricsPage() {
  const entities = await getEntitiesAsync();

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Metrics</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Key numbers across all entities. Connect APIs to light them up.</p>
      </div>
      {entities.map((entity) => (
        <div key={entity.slug}>
          <h3 className="text-xs tracking-[0.15em] uppercase text-muted-foreground/60 font-medium mb-3">{entity.name}</h3>
          <MetricsCards entitySlug={entity.slug} />
        </div>
      ))}
    </div>
  );
}
